import { ref } from '@vue/composition-api';
import { camelCase } from 'lodash-es';
import { mapObject } from '@aeternity/aepp-sdk/es/utils/other';
import { genSwaggerClient } from '@aeternity/aepp-sdk';
import camelcaseKeysDeep from 'camelcase-keys-deep';
import { fetchJson } from '../popup/utils';
import { IMiddleware } from '../types';

export function useMiddleware(store: any) {
  let middleware: IMiddleware | null = null;
  const isMiddlewareReady = ref(false);

  async function initMiddleware() {
    isMiddlewareReady.value = false;

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

    middleware = {
      ...mapObject(
        (await genSwaggerClient(middlewareUrl, { spec })).api,
        ([k, v]: any[]) => [camelCase(k), v],
      ),
      fetchByPath: (path: string) => fetchJson(`${middlewareUrl}${path}`).then(camelcaseKeysDeep),
    };

    store.commit('setMiddleware', middleware);

    isMiddlewareReady.value = true;
  }

  async function getMiddleware() {
    if (!middleware) {
      await initMiddleware();
    }
    return middleware as IMiddleware;
  }

  return {
    isMiddlewareReady,
    getMiddleware,
    initMiddleware,
  };
}
