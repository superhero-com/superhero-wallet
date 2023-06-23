import { computed } from '@vue/composition-api';
import { Universal, Node } from '@aeternity/aepp-sdk';
import {
  NETWORK_ID_MAINNET,
  NETWORK_ID_TESTNET,
  NODE_STATUS_CONNECTED,
  NODE_STATUS_CONNECTING,
  NODE_STATUS_ERROR,
  watchUntilTruthy,
} from '../popup/utils';
import type { IDefaultComposableOptions, ISdk, INetwork } from '../types';

let drySdk: ISdk;

/**
 * Composable that will replace the Vuex SDK plugin.
 * For now, it works as an abstraction layer.
 */
export function useSdk({ store }: IDefaultComposableOptions) {
  const sdk = computed<ISdk | undefined>(() => store.getters['sdkPlugin/sdk']);
  const isSdkReady = computed(() => !!sdk.value);

  const nodeStatus = computed((): string => store.state.nodeStatus);
  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);

  const isNodeConnecting = computed(() => nodeStatus.value === NODE_STATUS_CONNECTING);
  const isNodeReady = computed(() => nodeStatus.value === NODE_STATUS_CONNECTED);
  const isNodeError = computed(() => nodeStatus.value === NODE_STATUS_ERROR);
  const isNodeMainnet = computed(() => activeNetwork.value.networkId === NETWORK_ID_MAINNET);
  const isNodeTestnet = computed(() => activeNetwork.value.networkId === NETWORK_ID_TESTNET);
  const isCustomNodeNetwork = computed(() => !isNodeMainnet.value && !isNodeTestnet.value);

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
      const { compilerUrl, name, url } = activeNetwork.value;
      drySdk = await Universal({
        nodes: [{
          name,
          instance: await Node({ url }),
        }],
        compilerUrl,
      });
    } else if (activeNetwork.value.url !== drySdk.selectedNode.instance.url) {
      drySdk.pool.delete(activeNetwork.value.name);
      drySdk.addNode(activeNetwork.value.name, await Node({ url: activeNetwork.value.url }), true);
    }
    return drySdk;
  }

  return {
    isNodeReady,
    isNodeConnecting,
    isNodeError,
    isSdkReady,
    isNodeMainnet,
    isNodeTestnet,
    isCustomNodeNetwork,
    getSdk,
    getDrySdk,
  };
}
