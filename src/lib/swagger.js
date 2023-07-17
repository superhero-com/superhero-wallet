import SwaggerClient from 'swagger-client';
import JsonBig from './json-big';

// TODO: remove this file in favor of sdk 13's built-in way of wrapping middleware calls

let warnedAboutInternalApiUsage = false;

function snakeToPascal(s) {
  return s.replace(/_./g, (match) => match[1].toUpperCase());
}

function pascalToSnake(s) {
  return s.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
}

export const mapObject = (object, fn) => Object.fromEntries(Object.entries(object).map(fn));

const filterObject = (object, fn) => Object.fromEntries(Object.entries(object).filter(fn));

const traverseKeys = (fn, object) => {
  if (typeof object !== 'object' || object === null) return object;
  if (Array.isArray(object)) return object.map((i) => traverseKeys(fn, i));
  return mapObject(object, ([key, value]) => [
    fn(key), traverseKeys(fn, value),
  ]);
};

const snakizeKeys = traverseKeys.bind(null, pascalToSnake);

const pascalizeKeys = traverseKeys.bind(null, snakeToPascal);

/**
 * Generator of Swagger client
 * @function
 * @alias module:@aeternity/aepp-sdk/es/utils/swagger
 * @rtype Object
 * @param {String} specUrl - Swagger specification URL on external node host
 * @param {Object} options
 * @param {String} [options.spec] - Override OpenAPI definition
 * @param {String} [options.internalUrl] - Node internal URL
 * @param {Boolean} [options.disableCaseConversion]
 * @param {Function} [options.responseInterceptor]
 * @return {Object} Swagger client
 * @example (await genSwaggerClient('https://mainnet.aeternity.io/api')).getAccountByPubkey('ak_jupBUgZNbcC4krDLR3tAkw1iBZoBbkNeShAq4atBtpFWmz36r')
 */

export async function genSwaggerClient(
  specUrl,
  {
    spec, internalUrl, disableBigNumbers, disableCaseConversion, responseInterceptor,
  } = {},
) {
  const jsonImp = disableBigNumbers ? JSON : JsonBig;

  const [external, internal] = await Promise.all([specUrl, internalUrl].map((url) => {
    if (!url) return null;
    const pendingGetRequests = {};
    return SwaggerClient({
      url,
      spec,
      requestInterceptor: (request) => {
        if (request.method !== 'GET') return;
        // eslint-disable-next-line consistent-return
        return {
          ...request,
          userFetch: async (_url, _request) => {
            const key = JSON.stringify({ ..._request, _url });
            pendingGetRequests[key] ??= fetch(_url, _request);
            try {
              return (await pendingGetRequests[key]).clone();
            } finally {
              delete pendingGetRequests[key];
            }
          },
        };
      },
      responseInterceptor: (response) => {
        if (response.text === '' || response.text?.size === 0) return response;
        const body = jsonImp.parse(response.text);
        Object.assign(response, {
          body: disableCaseConversion ? body : pascalizeKeys(body),
        });
        return (responseInterceptor && responseInterceptor(response)) || response;
      },
    });
  }));

  const combinedApi = Object.assign(
    {},
    ...external.apis.external ? [external.apis.external] : Object.values(external.apis),
    mapObject(internal?.apis.internal || {}, ([key, handler]) => [key, (...args) => {
      if (!warnedAboutInternalApiUsage) {
        console.warn(
          'SDK\'s wrapper of aeternity node internal API is deprecated, please use external '
          + 'equivalent (for example, "sdk.api.protectedDryRunTxs" instead of "sdk.api.dryRunTxs") '
          + 'or create a wrapper of internal API by yourself (using "genSwaggerClient")',
        );
        warnedAboutInternalApiUsage = true;
      }
      return handler(...args);
    }]),
  );

  const opSpecs = Object.values(spec.paths)
    .map((paths) => Object.values(paths))
    .flat()
    .reduce((acc, n) => ({ ...acc, [n.operationId]: n }), {});

  const requestQueues = {};
  const api = mapObject(combinedApi, ([opId, handler]) => {
    const functionName = opId.slice(0, 1).toLowerCase() + snakeToPascal(opId.slice(1));
    return [
      functionName,
      async (...args) => {
        const opSpec = opSpecs[opId];
        const parameters = [
          ...opSpec.parameters,
          ...opSpec.requestBody
            ? [{
              required: opSpec.requestBody.required,
              schema: Object.values(opSpec.requestBody.content)[0].schema,
              name: '__requestBody',
            }]
            : [],
        ];
        const required = parameters.filter((param) => param.required).map((p) => p.name);
        if (![0, 1].includes(args.length - required.length)) {
          throw new Error(functionName, required.length, args.length);
        }
        const values = required.reduce(
          (acc, req, idx) => ({ ...acc, [req]: args[idx] }),
          args[required.length] || {},
        );
        const { __requestBody, __queue, ...stringified } = mapObject(values, ([param, value]) => {
          if (typeof value !== 'object') return [param, value];
          const rootKeys = Object.keys(parameters.find((p) => p.name === param).schema.properties);
          const filteredValue = filterObject(
            disableCaseConversion ? value : snakizeKeys(value),
            ([key]) => rootKeys.includes(key),
          );
          return [param, jsonImp.stringify(filteredValue)];
        });

        const request = async () => (await handler(stringified, { requestBody: __requestBody }))
          .body;
        if (!__queue) return request();
        const res = (requestQueues[__queue] ?? Promise.resolve()).then(request, request);
        // gap to ensure that node won't reject the nonce
        requestQueues[__queue] = res.then(() => new Promise((resolve) => setTimeout(resolve, 750)));
        return res;
      },
    ];
  });

  return Object.assign(external, { api });
}
