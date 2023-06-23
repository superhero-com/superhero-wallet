import { computed, ref } from '@vue/composition-api';
import camelCaseKeysDeep from 'camelcase-keys-deep';
import { load } from 'js-yaml';
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

  async function fetchFromMiddleware<T = any>(path: string): Promise<T | null> {
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

    const swagger = await fetch(`${middlewareUrl}/swagger/swagger_v2.yaml`).then((response) => response.text());
    const spec = load(swagger);

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
