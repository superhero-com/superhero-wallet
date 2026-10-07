import {
  computed,
  ref,
} from 'vue';
import {
  AeSdk,
  Node,
  WALLET_TYPE,
  RpcRejectedByUserError,
  RpcInternalError,
  RpcMethodNotFoundError,
  METHODS,
  RPC_STATUS,
  Encoded,
} from '@aeternity/aepp-sdk';

import type {
  INetwork,
  IResponseChallenge,
  IRespondChallenge,
  NetworkId,
} from '@/types';
import {
  APP_NAME,
  IN_FRAME,
  IS_EXTENSION,
  IS_OFFSCREEN_TAB,
  PROTOCOLS,
  RUNNING_IN_TESTS,
} from '@/constants';
import { handleUnknownError, watchUntilTruthy } from '@/utils';
import { FramesConnection } from '@/lib/FramesConnection';

import { AeSdkSuperhero } from '@/protocols/aeternity/libs/AeSdkSuperhero';
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
type OnAeppConnectionParams = Parameters<
  ConstructorParameters<typeof AeSdkSuperhero>[0]['onConnection']
>[1];
type AeppInfoData = OnAeppConnectionParams & { origin: string };

/**
 * Max time to wait for the active account to be restored before answering a
 * dApp subscription request (e.g. in the long-lived offscreen document).
 */
const ACCOUNT_RESTORE_TIMEOUT = 5000;

let composableInitialized = false;
let aeSdk: AeSdkSuperhero;
let aeSdkInitialization: Promise<void> | undefined;
let latestNodeResetId = 0;

const nodeNetworkId = ref<NetworkId>();

const isAeSdkInitializing = ref(false);
const isNodeResetting = ref(false);
const isAeSdkUpdating = computed(() => isAeSdkInitializing.value || isNodeResetting.value);
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

function replaceNode(sdk: AeSdk, name: string, node: Node) {
  sdk.pool.clear();
  sdk.addNode(name, node);
  // `AeSdkWallet.selectNode` is async and rejects when the node is down.
  Promise.resolve(sdk.selectNode(name)).catch(handleUnknownError);
}

export function useAeSdk() {
  const {
    activeNetworkName,
    areNetworksRestored,
    onNetworkChange,
  } = useNetworks();
  const {
    accountsAddressList,
    getLastActiveProtocolAccount,
    onAccountChange,
  } = useAccounts();
  const { checkOrAskPermission } = usePermissions();
  const { aeActiveNetworkSettings } = useAeNetworkSettings();

  /** Create Node instance and get connection status (stored only while `isCurrent()`). */
  async function createNodeInstance(url: string, isCurrent = () => true) {
    let nodeInstance: Node | null = null;
    let networkId: NetworkId | undefined;
    isAeNodeReady.value = false;
    isAeNodeError.value = false;
    isAeNodeConnecting.value = true;
    try {
      nodeInstance = new Node(url);
      networkId = (await nodeInstance.getStatus()).networkId;
    } catch (error) {
      // Only the initial status request failed (e.g. the network stack is not
      // ready yet right after a fresh browser start). The `Node` instance itself
      // is still valid and its requests will succeed once connectivity is back,
      // so we must keep it. Returning `null` here would put a `null` node into
      // the SDK pool and make `aeSdk.api` null, which crashes dApp connection
      // (`getWalletInfo` -> `api.getNetworkId()`) before any modal can appear.
    }
    if (isCurrent()) {
      nodeNetworkId.value = networkId;
      isAeNodeReady.value = !!networkId;
      isAeNodeError.value = !networkId;
      isAeNodeConnecting.value = false;
    }
    return nodeInstance;
  }

  /**
   * Re-resolve the node network id when the initial `getStatus` request failed
   * (e.g. the network stack was not ready right after a fresh browser start).
   * The node instance is kept in the pool and becomes usable once connectivity
   * is restored, but `nodeNetworkId` would otherwise stay empty until the user
   * switches networks, permanently breaking signing ("Not connected to any
   * network"). The SDK `Node` does not cache failed status requests, so asking
   * it again here recovers the network id without requiring a network switch.
   */
  async function ensureNodeNetworkId(): Promise<NetworkId | undefined> {
    if (nodeNetworkId.value || isAeNodeConnecting.value || !aeSdk?.isNodeConnected()) {
      return nodeNetworkId.value;
    }
    try {
      nodeNetworkId.value = (await aeSdk.api.getNetworkId()) as NetworkId;
      isAeNodeReady.value = true;
      isAeNodeError.value = false;
    } catch (error) {
      isAeNodeError.value = true;
    }
    return nodeNetworkId.value;
  }

  /** Of quick successive switches only the latest is applied. */
  function resetNode(newNetwork: INetwork): Promise<void> {
    latestNodeResetId += 1;
    const resetId = latestNodeResetId;
    const isCurrent = () => resetId === latestNodeResetId;
    isNodeResetting.value = true;

    return (async () => {
      try {
        await aeSdkInitialization;
        // `newNetwork` is missing while the active network is being removed.
        if (!isCurrent() || !newNetwork) {
          return;
        }
        const nodeInstance = await createNodeInstance(
          newNetwork.protocols.aeternity.nodeUrl,
          isCurrent,
        );
        if (!isCurrent()) {
          return;
        }
        if (aeSdk) {
          replaceNode(aeSdk, newNetwork.name, nodeInstance!);
        }
        if (dryAeSdk) {
          replaceNode(dryAeSdk, newNetwork.name, nodeInstance!);
        }
      } catch (error) {
        handleUnknownError(error);
      } finally {
        if (isCurrent()) {
          isNodeResetting.value = false;
          // Set by a superseded reset, and this one made no node.
          if (isAeNodeConnecting.value) {
            isAeNodeConnecting.value = false;
            isAeNodeReady.value = !!nodeNetworkId.value;
            isAeNodeError.value = !nodeNetworkId.value;
          }
        }
      }
    })();
  }

  async function initAeSdk() {
    isAeSdkInitializing.value = true;

    await watchUntilTruthy(areNetworksRestored);

    // Read with the URL: a switch during the status request changes it.
    const nodeName = activeNetworkName.value;
    const nodeInstance = await createNodeInstance(aeActiveNetworkSettings.value.nodeUrl);

    aeSdk = new AeSdkSuperhero(
      {
        name: 'Superhero',
        nodes: [{
          name: nodeName,
          instance: nodeInstance!,
        }],
        id: APP_NAME,
        type: IS_EXTENSION || IS_OFFSCREEN_TAB ? WALLET_TYPE.extension : WALLET_TYPE.window,
        // TODO: the ttl is set to 0 to avoid the timeout error when blockchain experiencing issues
        ttl: 0,
        onConnection(aeppId, params, origin) {
          aeppInfo[aeppId] = { ...params, origin };
        },
        onDisconnect(aeppId) {
          delete aeppInfo[aeppId];
        },
        async onSubscription(aeppId, _params, origin) {
          const aepp = aeppInfo[aeppId];
          // In the offscreen document `onSubscription` may run before
          // `onConnection` populates `aeppInfo`, so fall back to the `origin`
          // argument to avoid running the permission check with an undefined host.
          const host = (IS_OFFSCREEN_TAB ? aepp?.origin : origin) ?? origin;
          if (await checkOrAskPermission(METHODS.subscribeAddress, host)) {
            // The offscreen document may still be restoring accounts (e.g. right
            // after the extension is re-enabled), so wait (bounded) for the active
            // account to become available before reading its address. The timeout
            // stops the underlying watcher so repeated connect attempts in the
            // long-lived offscreen document don't leak watchers.
            const account = await watchUntilTruthy(
              () => getLastActiveProtocolAccount(PROTOCOLS.aeternity),
              ACCOUNT_RESTORE_TIMEOUT,
            );
            if (!account) {
              // The account is not available yet (slow restore or none exists).
              // This is a transient/internal wallet state, not an explicit user
              // denial, so report it as such instead of `RpcRejectedByUserError`.
              return Promise.reject(new RpcInternalError());
            }
            return account.address;
          }
          return Promise.reject(new RpcRejectedByUserError());
        },
        async onAskAccounts(aeppId, _params, origin) {
          const aepp = aeppInfo[aeppId];
          const host = (IS_OFFSCREEN_TAB ? aepp?.origin : origin) ?? origin;
          if (await checkOrAskPermission(METHODS.address, host)) {
            // Accounts may still be restoring in the long-lived offscreen
            // document, so wait (bounded) for the list to be populated before
            // answering. Without this a dApp listing accounts during a slow
            // restore could receive an empty list.
            await watchUntilTruthy(
              () => accountsAddressList.value.length,
              ACCOUNT_RESTORE_TIMEOUT,
            );
            return accountsAddressList.value;
          }
          return Promise.reject(new RpcRejectedByUserError());
        },
        onAskToSelectNetwork() {
          // TODO: add popup asking user to confirm network switch by aepp request
          throw new RpcMethodNotFoundError();
        },
      },
      nodeNetworkId,
    );

    if (IN_FRAME && !FramesConnection.initialized) {
      FramesConnection.init(aeSdk);
    }

    isAeSdkInitializing.value = false;
  }

  /**
   * Get the aeSdk instance. For now the SDK state is asynchronous.
   * TODO: this probably could be replaced with a computed prop.
   */
  async function getAeSdk(): Promise<AeSdkSuperhero> {
    // A switch requested during the SDK creation is applied right after it.
    while (isAeSdkUpdating.value || !aeSdk) {
      if (isAeSdkUpdating.value) {
        // eslint-disable-next-line no-await-in-loop
        await watchUntilTruthy(() => !isAeSdkUpdating.value);
      } else {
        aeSdkInitialization ??= initAeSdk();
        // eslint-disable-next-line no-await-in-loop
        await aeSdkInitialization;
      }
    }
    return aeSdk;
  }

  /**
   * dryAeSdk is the aeSdk instance with no accounts attached.
   * To use for multisig operations.
   */
  async function getDryAeSdk(): Promise<AeSdk> {
    if (!dryAeSdk) {
      const nodeInstance = new Node(
        aeActiveNetworkSettings.value.nodeUrl,
        { ignoreVersion: true, retryCount: 0 },
      );
      dryAeSdk = new AeSdk({
        nodes: [{
          name: activeNetworkName.value,
          instance: nodeInstance,
        }],
      });
    }
    if (isAeSdkUpdating.value && aeSdk) {
      await watchUntilTruthy(() => !isAeSdkUpdating.value);
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

    onNetworkChange((newNetwork) => {
      resetNode(newNetwork);
    });

    // Inform connected DAPPs about account change
    onAccountChange(async () => {
      const aeSdkLocal = await getAeSdk();
      aeSdkLocal._pushAccountsToApps();
    });
  }

  function setAeNodeError(value: boolean) {
    isAeNodeError.value = value;
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
    setAeNodeError,
    fetchRespondChallenge,
    createNodeInstance,
    ensureNodeNetworkId,
    disconnectDapps,
    waitTransactionMined,
  };
}
