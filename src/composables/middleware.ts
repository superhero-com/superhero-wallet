import { computed, ref } from 'vue';
import camelCaseKeysDeep from 'camelcase-keys-deep';
import { load } from 'js-yaml';
import { camelCase } from 'lodash-es';
import { genSwaggerClient, mapObject } from '@/lib/swagger';
import { fetchJson, watchUntilTruthy } from '@/utils';
import {
  IDefaultComposableOptions,
  IMiddleware,
  IMiddlewareStatus,
  INetwork,
} from '../types';

const middleware = ref<IMiddleware | null>(null);
const initializing = ref(false);
const isMiddlewareReady = computed(() => !!middleware.value);

let middlewareCurrentNetwork: INetwork;

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
    initializing.value = true;
    const { middlewareUrl } = await watchUntilTruthy(activeNetwork);

    const swagger = await fetch(`${middlewareUrl}/swagger/swagger_v2.yaml`).then((response) => response.text());
    const spec = load(swagger);

    middlewareCurrentNetwork = activeNetwork.value;

    middleware.value = mapObject(
      (await genSwaggerClient(middlewareUrl, { spec }) as any).api,
      ([key, value]: any[]) => [camelCase(key), value],
    ) as any;

    initializing.value = false;
  }

  /**
   * Get the current middleware instance. Create new one if it's not instantiated
   * or the currently used app network settings has different value for the `middlewareUrl`.
   */
  async function getMiddleware(): Promise<IMiddleware> {
    if (initializing.value) {
      await watchUntilTruthy(middleware);
    } else if (
      !middleware.value
      || middlewareCurrentNetwork?.middlewareUrl !== activeNetwork.value.middlewareUrl
    ) {
      await initMiddleware();
    }
    return middleware.value!;
  }

  function getMiddlewareRef() {
    return middleware;
  }

  return {
    getMiddleware,
    getMiddlewareRef,
    fetchFromMiddleware,
    fetchFromMiddlewareCamelCased,
    fetchMiddlewareStatus,
    isMiddlewareReady,
  };
}
