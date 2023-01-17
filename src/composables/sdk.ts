import { computed } from '@vue/composition-api';
import type { Store } from 'vuex';
import { ISuperHeroAeSdk } from '../types';

interface UseSdkOptions {
  /**
   * TODO: Temporary solution to avoid dependency circle
   */
  store: Store<any>
}

/**
 * Composable that will replace the Vuex SDK plugin.
 * For now it works as an abstraction layer.
 */
export function useSdk({ store }: UseSdkOptions) {
  const sdk = computed<ISuperHeroAeSdk>(() => store.getters['sdkPlugin/sdk']);

  const isNodeConnecting = computed<boolean>(() => store.state.sdkPlugin.isNodeConnecting);
  const isNodeReady = computed<boolean>(() => store.state.sdkPlugin.isNodeReady);
  const isNodeError = computed<boolean>(() => store.state.sdkPlugin.isNodeError);

  return {
    isNodeReady,
    isNodeConnecting,
    isNodeError,
    sdk,
  };
}
