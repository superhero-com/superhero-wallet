import {
  computed,
  ref,
} from 'vue';
import {
  AeSdk,
  Node,
  WALLET_TYPE,
  RpcRejectedByUserError,
  CompilerHttp,
} from '@aeternity/aepp-sdk';
import { ShSdkWallet } from '../lib/shSdkWallet';
import type {
  IDefaultComposableOptions,
  INetwork,
  IResponseChallenge,
  IRespondChallenge,
} from '../types';
import { App } from '../store/modules/permissions';
import {
  IN_FRAME,
  IS_EXTENSION,
  IS_EXTENSION_BACKGROUND,
  RUNNING_IN_TESTS,
} from '../lib/environment';
import {
  DEX_CONTRACTS,
  MODAL_CONFIRM_CONNECT,
  NETWORK_ID_MAINNET,
  NETWORK_ID_TESTNET,
  NODE_STATUS_CONNECTED,
  NODE_STATUS_CONNECTING,
  NODE_STATUS_ERROR,
  POPUP_TYPE_CONNECT,
  watchUntilTruthy,
} from '../popup/utils';
import { showPopup } from '../background/popupHandler';
import { useAccounts } from './accounts';
import { FramesConnection } from '../lib/FramesConnection';
import { useModals } from './modals';

let sdk: ShSdkWallet;
let drySdk: AeSdk;
let sdkBlocked = false;
let sdkCurrentNetwork: INetwork;
const nodeNetworkId = ref<string>();
const aeppInfo: Record<string, any> = {};

/**
 * Composable that will replace the Vuex SDK plugin.
 * For now, it works as an abstraction layer.
 */
export function useSdk({ store }: IDefaultComposableOptions) {
  const { isLoggedIn, activeAccount } = useAccounts({ store });
  const { openModal } = useModals();

  const isSdkReady = computed(() => !!sdk);

  const nodeStatus = computed((): string => store.state.nodeStatus);

  const isNodeConnecting = computed(() => nodeStatus.value === NODE_STATUS_CONNECTING);
  const isNodeReady = computed(() => nodeStatus.value === NODE_STATUS_CONNECTED);
  const isNodeError = computed(() => nodeStatus.value === NODE_STATUS_ERROR);

  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);
  const isNodeMainnet = computed(() => nodeNetworkId.value === NETWORK_ID_MAINNET);
  const isNodeTestnet = computed(() => nodeNetworkId.value === NETWORK_ID_TESTNET);
  const isNodeCustomNetwork = computed(() => !isNodeMainnet.value && !isNodeTestnet.value);

  const isTippingSupported = computed(() => (RUNNING_IN_TESTS || !isNodeCustomNetwork.value));

  const dexContracts = computed(
    () => nodeNetworkId.value ? DEX_CONTRACTS[nodeNetworkId.value] : undefined,
  );

  /**
   * Create Node instance and get connection status
   */
  async function createNodeInstance(url: string) {
    let nodeInstance;
    store.commit('setNodeStatus', NODE_STATUS_CONNECTING);
    try {
      // TODO: remove ignore version once HTTP compiler dependency is removed
      nodeInstance = new Node(url, { ignoreVersion: true });
      nodeNetworkId.value = (await nodeInstance.getStatus()).networkId;
      store.commit('setNodeStatus', NODE_STATUS_CONNECTED);
    } catch (error) {
      nodeNetworkId.value = undefined;
      store.commit('setNodeStatus', NODE_STATUS_ERROR);
      return null;
    }
    return nodeInstance;
  }

  async function initSdk() {
    sdkBlocked = true;

    await Promise.all([
      watchUntilTruthy(() => store.state.isRestored),
      watchUntilTruthy(isLoggedIn),
    ]);
    sdkCurrentNetwork = activeNetwork.value;
    const nodeInstance = await createNodeInstance(activeNetwork.value.url);

    sdk = new ShSdkWallet(store, {
      name: 'Superhero',
      nodes: [{
        name: activeNetwork.value.name,
        instance: nodeInstance!,
      }],
      id: 'Superhero Wallet',
      type: IS_EXTENSION ? WALLET_TYPE.extension : WALLET_TYPE.window,
      onCompiler: new CompilerHttp(activeNetwork.value.compilerUrl),
      onConnection(aeppId: string, params: any, origin: string) {
        aeppInfo[aeppId] = { ...params, origin };
      },
      onDisconnect(aeppId: string) {
        delete aeppInfo[aeppId];
      },
      async onSubscription(aeppId: string) {
        const aepp = aeppInfo[aeppId];
        const url = IS_EXTENSION_BACKGROUND ? new URL(aepp.origin) : new URL(origin);
        const app = new App(url);
        if (!(await store.dispatch('permissions/requestAddressForHost', {
          host: app.host.host,
          name: app.host.hostname,
          address: activeAccount.value.address,
          connectionPopupCb: () => IS_EXTENSION_BACKGROUND
            ? showPopup(app.host.href, POPUP_TYPE_CONNECT)
            : openModal(MODAL_CONFIRM_CONNECT, {
              app: {
                name: app.host.hostname,
                icons: [],
                protocol: app.host.protocol,
                host: app.host.host,
                url: app.host.href,
              },
            }),
        }))
        ) {
          return Promise.reject(new RpcRejectedByUserError('Rejected by user'));
        }
        return activeAccount.value.address;
      },
      onAskAccounts: () => {
        const { accountsAddressList } = useAccounts({ store });
        return accountsAddressList.value;
      },
    });

    if (IN_FRAME && !FramesConnection.initialized) {
      FramesConnection.init(sdk);
    }

    sdkBlocked = false;
  }

  /**
   * Get the SDK instance. For now the SDK state is asynchronous.
   * TODO: this probably could be replaced with a computed prop.
   */
  async function getSdk(): Promise<ShSdkWallet> {
    if (sdkBlocked) {
      await watchUntilTruthy(isSdkReady);
    } else if (!sdk) {
      await initSdk();
    }
    return sdk;
  }

  /**
   * drySdk is the sdk instance with no accounts attached.
   * To use for multisig operations.
   */
  async function getDrySdk(): Promise<AeSdk> {
    if (!drySdk) {
      const nodeInstance = await createNodeInstance(activeNetwork.value.url);
      drySdk = new AeSdk({
        nodes: [{
          name: activeNetwork.value.name,
          instance: nodeInstance!,
        }],
      });
      return drySdk;
    }
    const networkId = await drySdk.api.getNetworkId();
    if (activeNetwork.value.networkId !== networkId) {
      drySdk.pool.delete(sdkCurrentNetwork.name);
      const nodeInstance = await createNodeInstance(activeNetwork.value.url);
      drySdk.addNode(activeNetwork.value.name, nodeInstance!, true);
    }
    return drySdk;
  }

  async function fetchRespondChallenge(
    responseChallenge: IResponseChallenge,
  ): Promise<IRespondChallenge> {
    const sdkLocal = await getSdk();
    const signedChallenge = Buffer.from(
      await sdkLocal.signMessage(responseChallenge.challenge),
    ).toString('hex');

    return {
      challenge: responseChallenge.challenge,
      signature: signedChallenge,
    };
  }

  async function resetNode(oldNetwork: INetwork, newNetwork: INetwork) {
    sdk.pool.delete(oldNetwork.name);
    sdk.addNode(newNetwork.name, (await createNodeInstance(newNetwork.url))!, true);
  }

  return {
    isNodeReady,
    isNodeConnecting,
    isNodeError,
    isNodeMainnet,
    isNodeTestnet,
    isSdkReady,
    nodeNetworkId,
    isTippingSupported,
    dexContracts,
    getSdk,
    getDrySdk,
    resetNode,
    fetchRespondChallenge,
    createNodeInstance,
  };
}
