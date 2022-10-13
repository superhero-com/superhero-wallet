import { BrowserWindowMessageConnection } from '@aeternity/aepp-sdk';
import { mapObject } from '@aeternity/aepp-sdk/es/utils/other';
import { camelCase, isEqual, times } from 'lodash-es';
import camelcaseKeysDeep from 'camelcase-keys-deep';
import SwaggerClient from 'swagger-client';
import {
  NODE_STATUS_CONNECTING,
  NODE_STATUS_CONNECTION_DONE,
  NODE_STATUS_ERROR,
  fetchJson,
  executeAndSetInterval,
  watchUntilTruthy,
} from '../popup/utils';
import { IN_FRAME } from './environment';
import store from '../store';
import Logger from './logger';

async function initMiddleware() {
  const { middlewareUrl } = store.getters.activeNetwork;

  const swagUrl = `${middlewareUrl}/swagger/swagger.json`;

  const spec = await fetchJson(swagUrl);
  spec.paths = {
    ...spec.paths,
    '/txs/backward': {
      get: {
        operationId: 'getTxByAccount',
        parameters: [
          {
            in: 'query',
            name: 'account',
            required: true,
            type: 'string',
          },
          {
            in: 'query',
            name: 'limit',
            required: true,
            type: 'integer',
          },
          {
            in: 'query',
            name: 'page',
            required: true,
            type: 'integer',
          },
        ],
      },
    },
  };
  spec.basePath = '/mdw/';
  // TODO: remove after resolving https://github.com/aeternity/ae_mdw/issues/160
  delete spec.schemes;
  // TODO: remove after resolving https://github.com/aeternity/ae_mdw/issues/508
  spec.paths['/name/pointees/{id}'] = spec.paths['/names/pointees/{id}'];
  delete spec.paths['/names/pointees/{id}'];
  const { apis } = await new SwaggerClient(
    {
      url: middlewareUrl,
      spec,
      requestInterceptor: (request) => {
        if (request.method !== 'GET') return;
        // eslint-disable-next-line consistent-return
        return {
          ...request,
          userFetch: async (url, request1) => {
            const key = JSON.stringify({ ...request1, url });
            pendingGetRequests[key] ??= fetch(url, request1);
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
    },
  );
  const middleware = mapObject(
    { ...apis.Middleware, ...apis.default },
    ([k, v]) => [camelCase(k), v],
  );
  middleware.fetchByPath = (path) => fetchJson(`${middlewareUrl}${path}`).then(camelcaseKeysDeep);

  store.commit('setMiddleware', middleware);
}

let initSdkRunning = false;

if (IN_FRAME) {
  store.registerModule('sdk-frame-reset', {
    actions: {
      async reset({ rootGetters }) {
        Object.values(rootGetters['sdkPlugin/sdk'].rpcClients).forEach((aepp) => {
          if (aepp.info.status && aepp.info.status !== 'DISCONNECTED') {
            aepp.sendMessage(
              { method: 'connection.close', params: { reason: 'bye' }, jsonrpc: '2.0' },
              true,
            );
            aepp.disconnect();
          }
        });
      },
    },
  });
}

export default async function initSdk() {
  if (initSdkRunning) return;
  initSdkRunning = true;

  store.commit('setNodeStatus', NODE_STATUS_CONNECTING);
  try {
    await store.dispatch('sdkPlugin/initialize');
    await watchUntilTruthy(() => store.getters['sdkPlugin/sdk']);
    if (IN_FRAME) {
      const getArrayOfAvailableFrames = () => [
        window.parent,
        ...times(window.parent.frames.length, (i) => window.parent.frames[i]),
      ];

      const connectedFrames = new Set();
      executeAndSetInterval(
        () => getArrayOfAvailableFrames()
          .filter((frame) => frame !== window)
          .forEach((target) => {
            if (connectedFrames.has(target)) return;
            connectedFrames.add(target);
            const connection = BrowserWindowMessageConnection({ target });
            const originalConnect = connection.connect;
            let intervalId;
            connection.connect = function connect(onMessage) {
              originalConnect.call(this, (data, origin, source) => {
                if (source !== target) return;
                clearInterval(intervalId);
                onMessage(data, origin, source);
              });
            };
            store.getters['sdkPlugin/sdk'].addRpcClient(connection);
            intervalId = executeAndSetInterval(() => {
              if (!getArrayOfAvailableFrames().includes(target)) {
                clearInterval(intervalId);
                return;
              }
              store.getters['sdkPlugin/sdk'].shareWalletInfo(connection.sendMessage.bind(connection));
            }, 3000);
          }),
        3000,
      );
    }

    store.commit('initSdk', store.getters['sdkPlugin/sdk']);
    await Promise.all([
      store.dispatch('initContractInstances'),
      initMiddleware(),
    ]);
    store.commit('setNodeStatus', NODE_STATUS_CONNECTION_DONE);

    store.watch(
      (state, getters) => getters.activeNetwork,
      async (network, oldNetwork) => {
        if (isEqual(network, oldNetwork)) return;
        try {
          store.commit('setNodeStatus', NODE_STATUS_CONNECTING);
          await initMiddleware();
          store.commit('setNodeStatus', NODE_STATUS_CONNECTION_DONE);
        } catch (error) {
          store.commit('setNodeStatus', NODE_STATUS_ERROR);
          Logger.write(error);
        }
      },
    );
  } catch (e) {
    store.commit('setNodeStatus', NODE_STATUS_ERROR);
    Logger.write(e);
  } finally {
    initSdkRunning = false;
  }
}
