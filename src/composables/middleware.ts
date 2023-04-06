import { computed, ref } from 'vue';
import camelCaseKeysDeep from 'camelcase-keys-deep';
import { camelCase } from 'lodash-es';
import { mapObject } from '@aeternity/aepp-sdk/es/utils/other';
import { genSwaggerClient } from '@aeternity/aepp-sdk';
import { fetchJson, watchUntilTruthy } from '../popup/utils';
import {
  IDefaultComposableOptions,
  IMiddleware,
  IMiddlewareStatus,
  INetwork,
} from '../types';

const middleware = ref<IMiddleware | null>(null);
const initializing = ref(false);
const isMiddlewareReady = computed(() => !!middleware.value);

export function useMiddleware({ store }: IDefaultComposableOptions) {
  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);

  async function fetchFromMiddleware<T = any>(path: string): Promise<T> {
    const { middlewareUrl } = await watchUntilTruthy(activeNetwork);
    return fetchJson(`${middlewareUrl}${path}`);
  }

  async function fetchFromMiddlewareCamelCased(path: string) {
    return fetchFromMiddleware(path).then(camelCaseKeysDeep);
  }

  async function fetchMiddlewareStatus(): Promise<IMiddlewareStatus> {
    return fetchFromMiddlewareCamelCased('/status');
  }

  /**
   * Force to initialize new middleware instance.
   */
  async function initMiddleware() {
    const { middlewareUrl } = await watchUntilTruthy(activeNetwork);

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

    // Force the middleware to use https.
    // TODO Not applicable when we move to newer version of the MDW.
    delete spec.schemes;

    // Old swagger.json file is not maintained anymore so we need to tweak this
    // entry to align with the current v1 middleware.
    // TODO Not applicable when we move to newer version of the MDW.
    spec.paths['/name/pointees/{id}'] = spec.paths['/names/pointees/{id}'];
    delete spec.paths['/names/pointees/{id}'];

    middleware.value = mapObject(
      (await genSwaggerClient(middlewareUrl, { spec })).api,
      ([key, value]: any[]) => [camelCase(key), value],
    );

    initializing.value = false;
  }

  /**
   * Get the current middleware instance. Create new one if it's not instantiated.
   */
  async function getMiddleware(): Promise<IMiddleware> {
    if (initializing.value) {
      await watchUntilTruthy(middleware);
    } else if (!middleware.value) {
      await initMiddleware();
    }
    return middleware.value!;
  }

  function getMiddlewareRef() {
    return middleware;
  }

  return {
    initMiddleware,
    getMiddleware,
    getMiddlewareRef,
    fetchFromMiddleware,
    fetchFromMiddlewareCamelCased,
    fetchMiddlewareStatus,
    isMiddlewareReady,
  };
}
