import { computed, ref } from 'vue';
import camelCaseKeysDeep from 'camelcase-keys-deep';
import { load } from 'js-yaml';
import { camelCase } from 'lodash-es';
import type {
  IMiddleware,
  IMiddlewareStatus,
} from '@/types';
import { genSwaggerClient, mapObject } from '@/lib/swagger';
import { fetchJson, watchUntilTruthy } from '@/utils';
import type { IAeNetworkSettings } from '@/protocols/aeternity/types';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';

const middleware = ref<IMiddleware | null>(null);
const initializing = ref(false);
const isMiddlewareReady = computed(() => !!middleware.value);

/**
 * Store the last used network settings to detect network change
 * whenever the middleware is accessed.
 */
let middlewareCurrentAeNetworkSettings: IAeNetworkSettings;

export function useMiddleware() {
  const { aeActiveNetworkSettings } = useAeNetworkSettings();

  async function fetchFromMiddleware<T = any>(path: string): Promise<T | null> {
    await watchUntilTruthy(aeActiveNetworkSettings);
    return fetchJson(`${aeActiveNetworkSettings.value.middlewareUrl}${path}`);
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

    await watchUntilTruthy(aeActiveNetworkSettings);
    const { middlewareUrl } = aeActiveNetworkSettings.value;

    const swagger = await fetch(`${middlewareUrl}/swagger/swagger_v2.yaml`)
      .then((response) => response.text());
    const spec = load(swagger);

    middlewareCurrentAeNetworkSettings = aeActiveNetworkSettings.value;

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
    const previousMdwUrl = middlewareCurrentAeNetworkSettings?.middlewareUrl;
    const currentMdwUrl = aeActiveNetworkSettings.value.middlewareUrl;

    if (initializing.value) {
      await watchUntilTruthy(middleware);
    } else if (!middleware.value || previousMdwUrl !== currentMdwUrl) {
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
