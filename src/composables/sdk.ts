import { computed, ref } from 'vue';
import { Node } from '@aeternity/aepp-sdk';
import type { IDefaultComposableOptions, ISdk } from '../types';
import {
  DEX_CONTRACTS,
  NETWORK_ID_MAINNET,
  NETWORK_ID_TESTNET,
  NODE_STATUS_CONNECTED,
  NODE_STATUS_CONNECTING,
  NODE_STATUS_ERROR,
  watchUntilTruthy,
} from '../popup/utils';
import { RUNNING_IN_TESTS } from '../lib/environment';

const nodeNetworkId = ref<string>();

/**
 * Composable that will replace the Vuex SDK plugin.
 * For now, it works as an abstraction layer.
 */
export function useSdk({ store }: IDefaultComposableOptions) {
  const sdk = computed<ISdk | undefined>(() => store.getters['sdkPlugin/sdk']);
  const isSdkReady = computed(() => !!sdk.value);

  const nodeStatus = computed((): string => store.state.nodeStatus);

  const isNodeConnecting = computed(() => nodeStatus.value === NODE_STATUS_CONNECTING);
  const isNodeReady = computed(() => nodeStatus.value === NODE_STATUS_CONNECTED);
  const isNodeError = computed(() => nodeStatus.value === NODE_STATUS_ERROR);

  const isNodeMainnet = computed(() => nodeNetworkId.value === NETWORK_ID_MAINNET);
  const isNodeTestnet = computed(() => nodeNetworkId.value === NETWORK_ID_TESTNET);
  const isNodeCustomNetwork = computed(() => !isNodeMainnet.value && !isNodeTestnet.value);

  const isTippingSupported = computed(() => (RUNNING_IN_TESTS || !isNodeCustomNetwork.value));

  const dexContracts = computed(
    () => nodeNetworkId.value ? DEX_CONTRACTS[nodeNetworkId.value] : undefined,
  );

  async function createNewNodeInstance(url: string): Promise<Node | null> {
    try {
      const nodeInstance = await Node({ url });
      nodeNetworkId.value = nodeInstance.nodeNetworkId;
      return nodeInstance;
    } catch (error) {
      nodeNetworkId.value = undefined;
      store.commit('setNodeStatus', NODE_STATUS_ERROR);
      throw new Error();
    }
  }

  /**
   * Get the SDK instance. For now the SDK state is asynchronous.
   * TODO: With the new SDK version this probably could be replaced with a computed prop.
   */
  async function getSdk(): Promise<ISdk> {
    return watchUntilTruthy(() => sdk.value);
  }

  return {
    nodeNetworkId,
    isNodeReady,
    isNodeConnecting,
    isNodeError,
    isNodeMainnet,
    isNodeTestnet,
    isNodeCustomNetwork,
    isSdkReady,
    isTippingSupported,
    dexContracts,
    createNewNodeInstance,
    getSdk,
  };
}
