import { computed } from '@vue/composition-api';
import type { Store } from 'vuex';
import { ISdk } from '../types';
import { watchUntilTruthy } from '../popup/utils';

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
  const sdk = computed<ISdk | undefined>(() => store.getters['sdkPlugin/sdk']);
  const isSdkReady = computed(() => !!sdk.value);

  const isNodeConnecting = computed<boolean>(() => store.state.sdkPlugin.isNodeConnecting);
  const isNodeReady = computed<boolean>(() => store.state.sdkPlugin.isNodeReady);
  const isNodeError = computed<boolean>(() => store.state.sdkPlugin.isNodeError);

  /**
   * Get the SDK instance. For now the SDK state is asynchronous.
   * TODO: With the new SDK version this probably could be replaced with a computed prop.
   */
  async function getSdk(): Promise<ISdk> {
    return watchUntilTruthy(() => sdk.value);
  }

  return {
    isNodeReady,
    isNodeConnecting,
    isNodeError,
    isSdkReady,
    getSdk,
  };
}
