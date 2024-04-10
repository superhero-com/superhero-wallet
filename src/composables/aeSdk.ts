import {
  computed,
  ref,
} from 'vue';
import {
  AeSdk,
  Node,
  WALLET_TYPE,
  RpcRejectedByUserError,
  METHODS,
  RPC_STATUS,
  Encoded,
} from '@aeternity/aepp-sdk';
import { WalletApi } from '@aeternity/aepp-sdk/es/aepp-wallet-communication/rpc/types';
import type {
  INetwork,
  IResponseChallenge,
  IRespondChallenge,
  NetworkId,
} from '@/types';
import { AeSdkSuperhero } from '@/protocols/aeternity/libs/AeSdkSuperhero';
import { FramesConnection } from '@/lib/FramesConnection';
import { watchUntilTruthy } from '@/utils';
import {
  IN_FRAME,
  IS_EXTENSION,
  IS_EXTENSION_BACKGROUND,
  RUNNING_IN_TESTS,
  PROTOCOLS,
} from '@/constants';
import {
  AE_NETWORK_MAINNET_ID,
  AE_NETWORK_TESTNET_ID,
  DEX_CONTRACTS,
} from '@/protocols/aeternity/config';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';
import { useAccounts } from './accounts';
import { usePermissions } from './permissions';
import { useNetworks } from './networks';

/** AeSdkWallet / onConnected / params */
type OnAeppConnectionParams = Omit<Parameters<WalletApi[METHODS.connect]>[0], 'version'>;
type AeppInfoData = OnAeppConnectionParams & { origin: string };

let composableInitialized = false;
let aeSdk: AeSdkSuperhero;
let storedNetworkName: string;

const nodeNetworkId = ref<NetworkId>();

const isAeSdkUpdating = ref(false);
const isAeNodeReady = ref(false);
const isAeNodeConnecting = ref(false);
const isAeNodeError = ref(false);

/** List of connected dapps */
const aeppInfo: Record<string, AeppInfoData> = {};

let dryAeSdk: AeSdk;

const isAeSdkReady = computed(() => !isAeSdkUpdating.value && aeSdk);
const isNodeMainnet = computed(() => nodeNetworkId.value === AE_NETWORK_MAINNET_ID);
const isNodeTestnet = computed(() => nodeNetworkId.value === AE_NETWORK_TESTNET_ID);
const isNodeCustomNetwork = computed(() => !isNodeMainnet.value && !isNodeTestnet.value);

const isTippingSupported = computed(() => (RUNNING_IN_TESTS || !isNodeCustomNetwork.value));

const dexContracts = computed(
  () => nodeNetworkId.value ? DEX_CONTRACTS[nodeNetworkId.value] : undefined,
);

export function useAeSdk() {
  const {
    activeNetworkName,
    areNetworksRestored,
    onNetworkChange,
  } = useNetworks();
  const {
    accountsAddressList,
    isLoggedIn,
    getLastActiveProtocolAccount,
    onAccountChange,
  } = useAccounts();
  const { checkOrAskPermission } = usePermissions();
  const { aeActiveNetworkSettings } = useAeNetworkSettings();

  /**
   * Create Node instance and get connection status
   */
  async function createNodeInstance(url: string) {
    let nodeInstance;
    isAeNodeReady.value = false;
    isAeNodeError.value = false;
    isAeNodeConnecting.value = true;
    try {
      nodeInstance = new Node(url);
      nodeNetworkId.value = (await nodeInstance.getStatus()).networkId;
      isAeNodeReady.value = true;
    } catch (error) {
      nodeNetworkId.value = undefined;
      isAeNodeError.value = true;
      return null;
    }
    isAeNodeConnecting.value = false;
    return nodeInstance;
  }

  async function resetNode(oldNetwork: INetwork, newNetwork: INetwork) {
    isAeSdkUpdating.value = true;
    const nodeInstance = await createNodeInstance(newNetwork.protocols.aeternity.nodeUrl);
    aeSdk.pool.delete(oldNetwork.name);
    aeSdk.addNode(
      newNetwork.name,
      nodeInstance!,
      true,
    );
    isAeSdkUpdating.value = false;
  }

  async function initAeSdk() {
    isAeSdkUpdating.value = true;

    await Promise.all([
      watchUntilTruthy(isLoggedIn),
      watchUntilTruthy(areNetworksRestored),
    ]);

    storedNetworkName = activeNetworkName.value;
    const nodeInstance = await createNodeInstance(aeActiveNetworkSettings.value.nodeUrl);

    aeSdk = new AeSdkSuperhero(
      {
        name: 'Superhero',
        nodes: [{
          name: activeNetworkName.value,
          instance: nodeInstance!,
        }],
        id: 'Superhero Wallet',
        type: IS_EXTENSION ? WALLET_TYPE.extension : WALLET_TYPE.window,
        onConnection(aeppId: string, params: OnAeppConnectionParams, origin: string) {
          aeppInfo[aeppId] = { ...params, origin };
        },
        onDisconnect(aeppId: string) {
          delete aeppInfo[aeppId];
        },
        async onSubscription(aeppId: string, params: any, origin: string) {
          const aepp = aeppInfo[aeppId];
          const host = IS_EXTENSION_BACKGROUND ? aepp.origin : origin;
          if (await checkOrAskPermission(METHODS.subscribeAddress, host)) {
            return getLastActiveProtocolAccount(PROTOCOLS.aeternity)!.address;
          }
          return Promise.reject(new RpcRejectedByUserError('Rejected by user'));
        },
        async onAskAccounts(aeppId: string, params: any, origin: string) {
          const aepp = aeppInfo[aeppId];
          const host = IS_EXTENSION_BACKGROUND ? aepp.origin : origin;
          if (await checkOrAskPermission(METHODS.address, host)) {
            return accountsAddressList.value;
          }
          return Promise.reject(new RpcRejectedByUserError('Rejected by user'));
        },
      },
      nodeNetworkId,
    );

    if (IN_FRAME && !FramesConnection.initialized) {
      FramesConnection.init(aeSdk);
    }

    isAeSdkUpdating.value = false;
  }

  /**
   * Get the aeSdk instance. For now the SDK state is asynchronous.
   * TODO: this probably could be replaced with a computed prop.
   */
  async function getAeSdk(): Promise<AeSdkSuperhero> {
    if (isAeSdkUpdating.value) {
      await watchUntilTruthy(() => !isAeSdkUpdating.value);
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
      const nodeInstance = new Node(aeActiveNetworkSettings.value.nodeUrl, { ignoreVersion: true });
      dryAeSdk = new AeSdk({
        nodes: [{
          name: activeNetworkName.value,
          instance: nodeInstance,
        }],
      });
      storedNetworkName = activeNetworkName.value;
      return dryAeSdk;
    }

    if (storedNetworkName !== activeNetworkName.value) {
      const nodeInstance = new Node(aeActiveNetworkSettings.value.nodeUrl, { ignoreVersion: true });
      dryAeSdk.pool.delete(storedNetworkName);
      // remove the new network if it exists to avoid errors
      dryAeSdk.pool.delete(activeNetworkName.value);
      dryAeSdk.addNode(activeNetworkName.value, nodeInstance, true);
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

  async function disconnectDapps() {
    if (IN_FRAME) {
      const aeSdkLocal = await getAeSdk();
      aeSdkLocal._clients.forEach((aepp, aeppId) => {
        if (aepp.status === RPC_STATUS.CONNECTED) {
          aepp.rpc.notify(METHODS.closeConnection, null);
        }
        aeSdkLocal.removeRpcClient(aeppId);
      });
    }
  }

  async function waitTransactionMined(hash: Encoded.TxHash) {
    const aeSdkLocal = await getAeSdk();
    return aeSdkLocal.poll(hash);
  }

  if (!composableInitialized) {
    composableInitialized = true;

    onNetworkChange((newNetwork, oldNetwork) => {
      resetNode(oldNetwork, newNetwork);
    });

    // Inform connected DAPPs about account change
    onAccountChange(async () => {
      const aeSdkLocal = await getAeSdk();
      aeSdkLocal._pushAccountsToApps();
    });
  }

  return {
    isAeNodeReady,
    isAeNodeConnecting,
    isAeNodeError,
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
    disconnectDapps,
    waitTransactionMined,
  };
}
