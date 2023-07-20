import {
  computed,
  ref,
} from 'vue';
import {
  AeSdk,
  Node,
  WALLET_TYPE,
  RpcRejectedByUserError,
} from '@aeternity/aepp-sdk';
import { AeSdkSupehero } from '../lib/AeSdkSupehero';
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

let aeSdk: AeSdkSupehero;
let dryAeSdk: AeSdk;
let aeSdkBlocked = false;
const isAeSdkReady = ref(false);
let aeSdkCurrentNetwork: INetwork;
const nodeNetworkId = ref<string>();
const aeppInfo: Record<string, any> = {};

export function useAeSdk({ store }: IDefaultComposableOptions) {
  const { isLoggedIn, activeAccount } = useAccounts({ store });
  const { openModal } = useModals();

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

  async function initAeSdk() {
    aeSdkBlocked = true;
    isAeSdkReady.value = false;

    await Promise.all([
      watchUntilTruthy(() => store.state.isRestored),
      watchUntilTruthy(isLoggedIn),
    ]);
    aeSdkCurrentNetwork = activeNetwork.value;
    const nodeInstance = await createNodeInstance(activeNetwork.value.url);

    aeSdk = new AeSdkSupehero(store, {
      name: 'Superhero',
      nodes: [{
        name: activeNetwork.value.name,
        instance: nodeInstance!,
      }],
      id: 'Superhero Wallet',
      type: IS_EXTENSION ? WALLET_TYPE.extension : WALLET_TYPE.window,
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
      FramesConnection.init(aeSdk);
    }

    aeSdkBlocked = false;
    isAeSdkReady.value = true;
  }

  /**
   * Get the aeSdk instance. For now the SDK state is asynchronous.
   * TODO: this probably could be replaced with a computed prop.
   */
  async function getAeSdk(): Promise<AeSdkSupehero> {
    if (aeSdkBlocked) {
      await watchUntilTruthy(isAeSdkReady);
    } else if (!aeSdk) {
      await initAeSdk();
    }
    return aeSdk;
  }

  /**
   * dryAeSdk is the aeSdk instance with no accounts attached.
   * To use for multisig operations.
   */
  async function getDryAeSdk(): Promise<AeSdk> {
    if (!dryAeSdk) {
      const nodeInstance = await createNodeInstance(activeNetwork.value.url);
      dryAeSdk = new AeSdk({
        nodes: [{
          name: activeNetwork.value.name,
          instance: nodeInstance!,
        }],
      });
      return dryAeSdk;
    }
    const networkId = await dryAeSdk.api.getNetworkId();
    if (activeNetwork.value.networkId !== networkId) {
      dryAeSdk.pool.delete(aeSdkCurrentNetwork.name);
      const nodeInstance = await createNodeInstance(activeNetwork.value.url);
      dryAeSdk.addNode(activeNetwork.value.name, nodeInstance!, true);
    }
    return dryAeSdk;
  }

  async function fetchRespondChallenge(
    responseChallenge: IResponseChallenge,
  ): Promise<IRespondChallenge> {
    const aeSdkLocal = await getAeSdk();
    const signedChallenge = Buffer.from(
      await aeSdkLocal.signMessage(responseChallenge.challenge),
    ).toString('hex');

    return {
      challenge: responseChallenge.challenge,
      signature: signedChallenge,
    };
  }

  async function resetNode(oldNetwork: INetwork, newNetwork: INetwork) {
    aeSdk.pool.delete(oldNetwork.name);
    aeSdk.addNode(newNetwork.name, (await createNodeInstance(newNetwork.url))!, true);
  }

  return {
    isNodeReady,
    isNodeConnecting,
    isNodeError,
    isNodeMainnet,
    isNodeTestnet,
    isAeSdkReady,
    nodeNetworkId,
    isTippingSupported,
    dexContracts,
    getAeSdk,
    getDryAeSdk,
    resetNode,
    fetchRespondChallenge,
    createNodeInstance,
  };
}
