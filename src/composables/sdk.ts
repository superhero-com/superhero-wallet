import { ref } from '@vue/composition-api';
import { ISdk } from '../types';
import { watchUntilTruthy } from '../popup/utils';
import { useGetter } from './vuex';

export function useSdk() {
  const isNodeReady = ref(false);
  const isNodeConnecting = ref(false); // TODO
  const isNodeError = ref(false); // TODO

  /**
   * Get the SDK instance. For now the SDK state is asynchronous.
   * TODO: With the new SDK version ths should be replaced with a computed
   */
  async function getSdk() {
    const sdk = useGetter<ISdk>('sdkPlugin/sdk');
    await watchUntilTruthy(() => sdk);
    return sdk.value;
  }

  return {
    isNodeReady,
    isNodeConnecting,
    isNodeError,
    getSdk,
  };
}
