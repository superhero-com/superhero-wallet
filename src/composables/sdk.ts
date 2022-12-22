import { computed } from '@vue/composition-api';
import { ISdk } from '../types';
import { watchUntilTruthy } from '../popup/utils';
import { useGetter, useState } from './vuex';

/**
 * Composable that will replace the Vuex SDK plugin.
 * For now it works as an abstraction layer.
 */
export function useSdk() {
  const sdk = useGetter<ISdk | undefined>('sdkPlugin/sdk');
  const isSdkReady = computed(() => !!sdk.value);

  const isNodeConnecting = useState<boolean>('sdkPlugin', 'isNodeConnecting');
  const isNodeReady = useState<boolean>('sdkPlugin', 'isNodeReady');
  const isNodeError = useState<boolean>('sdkPlugin', 'isNodeError');

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
