import type { SessionTypes } from '@walletconnect/types';
import type { Web3Wallet as IWeb3Wallet } from '@walletconnect/web3wallet';
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';
import { fromWei, toChecksumAddress } from 'web3-utils';
import { reactive } from 'vue';
import { uniq } from 'lodash-es';
import { METHODS, Tag } from '@aeternity/aepp-sdk';

import type { AccountAddress } from '@/types';
import {
  APP_NAME,
  APP_URL,
  PROTOCOLS,
  STORAGE_KEYS,
  WALLET_CONNECT_PROJECT_ID,
} from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import { ETH_CHAIN_NAMESPACE, ETH_CONTRACT_ID } from '@/protocols/ethereum/config';
import { IEthNetworkSettings } from '@/protocols/ethereum/types';
import { TX_FUNCTIONS } from '@/protocols/aeternity/config';

import { useModals } from './modals';
import { usePermissions } from './permissions';
import { useStorageRef } from './storageRef';
import { useNetworks } from './networks';

export type WalletConnectUri = `ws:${string}`;

type SupportedRequestMethod =
  | 'eth_sendTransaction'
  | 'personal_sign';

/** All method params are encoded */
interface SendTransactionParams {
  data: string;
  from: string;
  gas: string;
  to: string;
  value: string;
}

let composableInitialized = false;
let web3wallet: Awaited<ReturnType<typeof IWeb3Wallet.init>> | null;

const wcSession = useStorageRef<null | SessionTypes.Struct>(
  null,
  STORAGE_KEYS.walletConnectSession,
);

const wcState = reactive({
  connecting: false,
  disconnecting: false,
  error: false,
  peerDisconnected: false,
});

/**
 * TODO add description
 */
export function useWalletConnect() {
  const { openDefaultModal } = useModals();
  const { checkOrAskPermission } = usePermissions();
  const { networks } = useNetworks();

  const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.ethereum);

  const sessionRequestMethodHandlers: Partial<{
    [key in SupportedRequestMethod]: (p: any) => Promise<string | false>
  }> = {
    eth_sendTransaction: async (params: SendTransactionParams) => {
      const senderId = toChecksumAddress(params.from);
      const recipientId = toChecksumAddress(params.to);
      const { url, name } = wcSession.value?.peer.metadata! || {};
      const isCoinTransfer = !!params.value; // `value` is present only when sending ETH
      const tag = (params.data) ? Tag.ContractCallTx : Tag.SpendTx;

      console.log('[WC / eth_sendTransaction handler]', {
        senderId, recipientId, params,
      });

      const permitted = await checkOrAskPermission(
        METHODS.sign,
        wcSession.value?.peer?.metadata?.url,
        {
          protocol: PROTOCOLS.ethereum,
          app: { url, host: url ? new URL(url).hostname : '', name },
          tx: {
            amount: params.value ? +fromWei(params.value, 'ether') : 0,
            fee: params.gas ? +fromWei(params.gas, 'ether') : 0,
            contractId: (isCoinTransfer) ? ETH_CONTRACT_ID : recipientId,
            type: Tag[tag],
            tag,
            function: TX_FUNCTIONS.swapExactTokensForTokens, // TODO
            senderId,
            recipientId,
            data: params.data, // TODO find out the way for decoding the data
          },
        },
      );
      if (permitted) {
        if (adapter?.transferPreparedTransaction) {
          const actionResult = await adapter.transferPreparedTransaction(params);
          return actionResult?.hash ?? false;
        }
      }
      return false;
    },
  };

  function resetSessionAndState() {
    Object.keys(wcState).forEach((key) => { (wcState as Record<string, boolean>)[key] = false; });
    wcSession.value = null;
    web3wallet = null;
  }

  function handleConnectionError(error: any) {
    resetSessionAndState();
    wcState.error = true;

    if (error.message) {
      openDefaultModal({
        title: 'Connection failed', // TODO
        msg: error.message,
        icon: 'alert',
        textCenter: true,
      });
    }
  }

  async function initWeb3wallet() {
    if (!WALLET_CONNECT_PROJECT_ID) {
      throw new Error('WalletConnect Project ID is not set');
    }

    // Dynamic import to avoid bloating the main built file with unused features.
    const [
      { Core },
      { Web3Wallet },
    ] = await Promise.all([
      import('@walletconnect/core'),
      import('@walletconnect/web3wallet'),
    ]);

    const core = new Core({
      projectId: WALLET_CONNECT_PROJECT_ID,
      logger: '',
    });

    // Create WebSocket channel
    return Web3Wallet.init({
      core,
      metadata: {
        name: APP_NAME,
        description: 'Superhero Wallet App Description', // TODO
        url: `https://${APP_URL}`,
        icons: ['https://superhero.com/assets/favicon-48x48.png'],
      },
    });
  }

  function monitorSessionEvents() {
    // Connected DAPP requested action, e.g.: signing
    web3wallet?.on('session_request', async ({ topic, params: proposal, id }) => {
      console.log('[WC / W3W event / session_request', { proposal });

      const method = proposal.request.method as SupportedRequestMethod;
      const methodHandler = sessionRequestMethodHandlers[method];
      const result = await methodHandler?.(proposal.request.params[0]);

      console.log('[WC / W3W event / session_request RESPONSE', { result });

      web3wallet!.respondSessionRequest({
        topic,
        response: {
          id,
          jsonrpc: '2.0',
          ...(result) ? { result } : { error: { code: 5000, message: 'User rejected.' } },
        },
      });
    });

    // User manually initiated disconnecting on the DAPP side
    web3wallet?.on('session_delete', async () => {
      resetSessionAndState();
      wcState.peerDisconnected = true;
      setTimeout(() => { wcState.peerDisconnected = false; }, 10000);
    });
  }

  /**
   * @param uri identifier copied or scanned from QR code
   * @param addresses ETH address list
   */
  async function connect(uri: WalletConnectUri, addresses: AccountAddress[]) {
    wcState.connecting = true;

    try {
      if (!web3wallet) {
        web3wallet = await initWeb3wallet();
        console.log('[WC / web3wallet initiated]', { web3wallet });
      }

      // Ask the DAPP to send `session_proposal` event.
      await web3wallet.pair({ uri });

      // After requesting pairing with the DAPP we receive session proposal
      // which we need to approve or reject.
      web3wallet.on('session_proposal', async ({ id, params: proposal }) => {
        const availableChainIds = uniq(Object.values(networks.value)
          .map(({ protocols }) => (protocols[PROTOCOLS.ethereum] as IEthNetworkSettings).chainId));

        /** Supported chains (networks) in CAIP-2 format */
        const chains = availableChainIds.map((chainId) => `${ETH_CHAIN_NAMESPACE}:${chainId}`);

        /** User's accounts in CAIP-10 format */
        const accounts = addresses.map((address) => chains.map((chain) => `${chain}:${address}`)).flat();

        const methods: SupportedRequestMethod[] = ['personal_sign', 'eth_sendTransaction'];

        monitorSessionEvents();

        try {
          wcSession.value = await web3wallet!.approveSession({
            id,
            namespaces: buildApprovedNamespaces({
              proposal,
              supportedNamespaces: {
                [ETH_CHAIN_NAMESPACE]: {
                  accounts,
                  chains,
                  methods,
                  events: ['accountsChanged', 'chainChanged'],
                },
              },
            }),
          });
        } catch (error: any) {
          web3wallet!.rejectSession({ id, reason: getSdkError('USER_REJECTED') });
          handleConnectionError(error);
        } finally {
          wcState.connecting = false;
        }
      });
    } catch (error: any) {
      handleConnectionError(error);
    }
  }

  /**
   * Reset current state and announce session termination to connected dapp.
   */
  async function disconnect() {
    console.log('[WC / disconnect...]');
    wcState.disconnecting = true;
    if (web3wallet && wcSession.value?.topic) {
      try {
        await web3wallet.disconnectSession({
          topic: wcSession.value.topic,
          reason: getSdkError('USER_DISCONNECTED'),
        });
      } catch { /* We don't care if session existed */ }
    }
    resetSessionAndState();
    console.log('[WC / disconnected]');
    wcState.disconnecting = false;
  }

  if (!composableInitialized) {
    composableInitialized = true;

    // Restore open WC session after refreshing the tab or extension.
    // As the session is not important immediately after opening the app we are delaying it
    // until other more important features are ready.
    setTimeout(async () => {
      if (wcSession.value) {
        web3wallet = await initWeb3wallet();
        const sessions = web3wallet.getActiveSessions();
        const restoredTopic = Object.values(sessions)?.[0]?.topic;

        // If restored session is different than the currently open we need to close session.
        if (wcSession.value?.topic !== restoredTopic) {
          disconnect();
        } else if (restoredTopic) {
          monitorSessionEvents();
        }
      }
    }, 1000);
  }

  return {
    connect,
    disconnect,
    wcSession,
    wcState,
  };
}
