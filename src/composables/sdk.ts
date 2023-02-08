import { computed } from '@vue/composition-api';
import { Universal, Node } from '@aeternity/aepp-sdk';
import { watchUntilTruthy } from '../popup/utils';
import type { IDefaultComposableOptions, ISdk } from '../types';

let drySdk: ISdk;

/**
 * Composable that will replace the Vuex SDK plugin.
 * For now, it works as an abstraction layer.
 */
export function useSdk({ store }: IDefaultComposableOptions) {
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

  /**
   * drySdk is the sdk instance with no accounts attached.
   * To use for multisig operations.
   */
  async function getDrySdk(): Promise<ISdk> {
    if (!drySdk) {
      const { compilerUrl, name, url } = store.getters.activeNetwork;
      drySdk = await Universal({
        nodes: [{
          name,
          instance: await Node({ url }),
        }],
        compilerUrl,
      });
    }
    return drySdk;
  }

  return {
    isNodeReady,
    isNodeConnecting,
    isNodeError,
    isSdkReady,
    getSdk,
    getDrySdk,
  };
}
