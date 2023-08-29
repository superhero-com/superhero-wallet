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
import type {
  IDefaultComposableOptions,
  INetwork,
  IResponseChallenge,
  IRespondChallenge,
} from '@/types';
import { AeSdkSuperhero } from '@/protocols/aeternity/libs/AeSdkSuperhero';
import { FramesConnection } from '@/lib/FramesConnection';
import { App } from '@/store/modules/permissions';
import { watchUntilTruthy } from '@/utils';
import {
  IN_FRAME,
  IS_EXTENSION,
  IS_EXTENSION_BACKGROUND,
  MODAL_CONFIRM_ACCOUNT_LIST,
  MODAL_CONFIRM_CONNECT,
  NODE_STATUS_CONNECTED,
  NODE_STATUS_CONNECTING,
  NODE_STATUS_ERROR,
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_ACCOUNT_LIST,
  RUNNING_IN_TESTS,
  PROTOCOL_AETERNITY,
} from '@/constants';
import { showPopup } from '@/background/popupHandler';
import {
  AE_NETWORK_MAINNET_ID,
  AE_NETWORK_TESTNET_ID,
  DEX_CONTRACTS,
} from '@/protocols/aeternity/config';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';
import { useAccounts } from './accounts';
import { useModals } from './modals';

let aeSdk: AeSdkSuperhero;
let aeSdkBlocked = false;
let storedNetworkName: string;
const isAeSdkReady = ref(false);
const nodeNetworkId = ref<string>();
const aeppInfo: Record<string, any> = {};

let dryAeSdk: AeSdk;
let dryAeSdkCurrentNodeNetworkId: string;

export function useAeSdk({ store }: IDefaultComposableOptions) {
  const { aeActiveNetworkSettings, activeNetworkName } = useAeNetworkSettings();
  const { isLoggedIn, getLastActiveProtocolAccount } = useAccounts({ store });
  const { openModal } = useModals();

  const nodeStatus = computed((): string => store.state.nodeStatus);

  const isNodeConnecting = computed(() => nodeStatus.value === NODE_STATUS_CONNECTING);
  const isNodeReady = computed(() => nodeStatus.value === NODE_STATUS_CONNECTED);
  const isNodeError = computed(() => nodeStatus.value === NODE_STATUS_ERROR);

  const isNodeMainnet = computed(() => nodeNetworkId.value === AE_NETWORK_MAINNET_ID);
  const isNodeTestnet = computed(() => nodeNetworkId.value === AE_NETWORK_TESTNET_ID);
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
    storedNetworkName = activeNetworkName.value;
    const nodeInstance = await createNodeInstance(aeActiveNetworkSettings.value.nodeUrl);

    aeSdk = new AeSdkSuperhero(store, {
      name: 'Superhero',
      nodes: [{
        name: activeNetworkName.value,
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
      async onSubscription(aeppId: string, params: any, origin: string) {
        const aepp = aeppInfo[aeppId];
        const url = IS_EXTENSION_BACKGROUND ? new URL(aepp.origin) : new URL(origin);
        const app = new App(url);
        if (!(await store.dispatch('permissions/requestAddressForHost', {
          host: app.host.host,
          name: app.host.hostname,
          address: getLastActiveProtocolAccount(PROTOCOL_AETERNITY)!.address,
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
        return getLastActiveProtocolAccount(PROTOCOL_AETERNITY)!.address;
      },
      async onAskAccounts(aeppId: string, params: any, origin: string) {
        const aepp = aeppInfo[aeppId];
        const url = IS_EXTENSION_BACKGROUND ? new URL(aepp.origin) : new URL(origin);
        const app = new App(url);
        if (!(await store.dispatch('permissions/requestAllAddressesForHost', {
          host: app.host.host,
          name: app.host.hostname,
          address: getLastActiveProtocolAccount(PROTOCOL_AETERNITY)!.address,
          connectionPopupCb: () => IS_EXTENSION_BACKGROUND
            ? showPopup(app.host.href, POPUP_TYPE_ACCOUNT_LIST)
            : openModal(MODAL_CONFIRM_ACCOUNT_LIST, {
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
  async function getAeSdk(): Promise<AeSdkSuperhero> {
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
      const nodeInstance = await createNodeInstance(aeActiveNetworkSettings.value.nodeUrl);
      dryAeSdk = new AeSdk({
        nodes: [{
          name: activeNetworkName.value,
          instance: nodeInstance!,
        }],
      });
      dryAeSdkCurrentNodeNetworkId = await nodeInstance?.getNetworkId()!;
      return dryAeSdk;
    }
    const networkId = await dryAeSdk.api.getNetworkId();
    if (dryAeSdkCurrentNodeNetworkId !== networkId) {
      dryAeSdk.pool.delete(storedNetworkName);
      const nodeInstance = await createNodeInstance(aeActiveNetworkSettings.value.nodeUrl);
      dryAeSdk.addNode(activeNetworkName.value, nodeInstance!, true);
      dryAeSdkCurrentNodeNetworkId = networkId;
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
    aeSdk.addNode(
      newNetwork.name,
      (await createNodeInstance(newNetwork.protocols.aeternity.nodeUrl))!,
      true,
    );
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
