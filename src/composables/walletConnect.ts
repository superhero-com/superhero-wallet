import { uniq } from 'lodash-es';
import type { SessionTypes } from '@walletconnect/types';
import type { WalletKit as IWeb3Wallet } from '@reown/walletkit';
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';
import {
  computed,
  reactive,
  ref,
  watch,
} from 'vue';
import { App } from '@capacitor/app';

import {
  APP_NAME,
  APP_URL,
  PROTOCOLS,
  STORAGE_KEYS,
  WALLET_CONNECT_PROJECT_ID,
} from '@/constants';
import { tg } from '@/popup/plugins/i18n';

import { ETH_CHAIN_NAMESPACE, ETH_RPC_METHODS } from '@/protocols/ethereum/config';
import { EthRpcSupportedMethods, IEthNetworkSettings } from '@/protocols/ethereum/types';
import { handleEthereumRpcMethod } from '@/protocols/ethereum/libs/EthereumRpcMethodsHandler';

import { useAccounts } from './accounts';
import { useModals } from './modals';
import { useStorageRef } from './storageRef';
import { useNetworks } from './networks';

export type WalletConnectUri = `ws:${string}`;

type SupportedRequestMethod =
  | 'eth_sendTransaction'
  | 'personal_sign';

const isOpenUsingDeeplink = ref(false);
let composableInitialized = false;
let web3wallet: Awaited<ReturnType<typeof IWeb3Wallet.init>> | null;

const wcSession = useStorageRef<null | SessionTypes.Struct>(
  null,
  STORAGE_KEYS.walletConnectSession,
  {
    backgroundSync: true,
  },
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
export function useWalletConnect({ offscreen } = { offscreen: false }) {
  const { activeAccount, accountsGroupedByProtocol, getLastActiveProtocolAccount } = useAccounts();
  const { activeNetwork, networks } = useNetworks();
  const { openDefaultModal } = useModals();

  const ethAccounts = computed(() => accountsGroupedByProtocol.value[PROTOCOLS.ethereum] || []);

  function closeAppIfOpenUsingDeeplink() {
    if (isOpenUsingDeeplink.value) {
      isOpenUsingDeeplink.value = false;
      setTimeout(() => App.exitApp(), 3000);
    }
  }

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
        title: tg('common.connectionFailed'),
        msg: error.message,
        icon: 'critical',
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
      { WalletKit },
    ] = await Promise.all([
      import('@walletconnect/core'),
      import('@reown/walletkit'),
    ]);

    const core = new Core({
      projectId: WALLET_CONNECT_PROJECT_ID,
      logger: '',
    });

    // Create WebSocket channel
    return WalletKit.init({
      core,
      metadata: {
        name: APP_NAME,
        description: 'Superhero Wallet App Description', // TODO
        url: `https://${APP_URL}`,
        icons: ['https://superhero.com/assets/favicon-48x48.png'],
      },
    });
  }

  /**
   * Reset current state and announce session termination to connected dapp.
   */
  async function disconnect() {
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
    wcState.disconnecting = false;
  }

  function getFormattedAccountsAndChains() {
    const lastActiveAccount = getLastActiveProtocolAccount(PROTOCOLS.ethereum);

    // Chain IDs with the active network's chain ID as the first one
    const availableChainIds = uniq(
      Object.values(networks.value)
        .sort(({ name }) => (name === activeNetwork.value.name) ? -1 : 1)
        .map(({ protocols }) => (protocols[PROTOCOLS.ethereum] as IEthNetworkSettings).chainId),
    );

    // Supported chains (networks) in CAIP-2 format
    const chains = availableChainIds.map((chainId) => `${ETH_CHAIN_NAMESPACE}:${chainId}`);

    // User's accounts in CAIP-10 format. Active account first.
    const accounts = chains.map(
      (chain) => ethAccounts.value
        .sort(({ address }) => (address === lastActiveAccount?.address) ? -1 : 1)
        .map(({ address }) => `${chain}:${address}`),
    ).flat();

    return { chains, accounts };
  }

  function monitorActiveSessionEvents() {
    // Connected DAPP requested action, e.g.: signing
    web3wallet?.on('session_request', async ({ topic, params: proposal, id }) => {
      const { url, name } = wcSession.value?.peer.metadata! || {};
      const { result, error } = await handleEthereumRpcMethod(
        url,
        proposal.request.method as EthRpcSupportedMethods,
        proposal.request.method === ETH_RPC_METHODS.signPersonal
          ? { data: proposal.request.params[0] }
          : proposal.request.params[0],
        name,
      );

      web3wallet!.respondSessionRequest({
        topic,
        response: {
          id,
          jsonrpc: '2.0',
          ...(result
            ? { result }
            : {
              error: {
                code: error?.code || 5000,
                message: error?.message || 'User rejected.',
              },
            }),
        },
      });
    });

    // User manually initiated disconnecting on the DAPP side
    web3wallet?.on('session_delete', async () => {
      resetSessionAndState();
      wcState.peerDisconnected = true;
      setTimeout(() => {
        wcState.peerDisconnected = false;
      }, 10000);
    });
  }

  /**
   * Notify the DAPP about the active wallet account change.
   */
  function monitorActiveAccountAndNetwork() {
    const unwatch = watch([activeAccount, activeNetwork], async ([newAccount]) => {
      if (newAccount.protocol !== PROTOCOLS.ethereum) {
        return;
      }
      if (web3wallet && wcSession.value) {
        const { accounts, chains } = getFormattedAccountsAndChains();

        wcSession.value.namespaces[ETH_CHAIN_NAMESPACE].chains = chains;
        wcSession.value.namespaces[ETH_CHAIN_NAMESPACE].accounts = accounts;

        try {
          const { acknowledged } = await web3wallet.updateSession({
            topic: wcSession.value.topic,
            namespaces: wcSession.value.namespaces,
          });

          // Even if the session update is acknowledged some DAPPS does not update the UI
          // to match the change. For example Uniswap does not switch the account if user did it
          // on the wallet side.
          await acknowledged();
        } catch (error) {
          disconnect();
        }
      } else {
        unwatch();
        disconnect();
      }
    });
  }

  /**
   * @param uri identifier copied or scanned from QR code
   */
  async function connect(uri: WalletConnectUri) {
    wcState.connecting = true;

    try {
      if (!web3wallet) {
        web3wallet = await initWeb3wallet();
      }

      // Ask the DAPP to send `session_proposal` event.
      await web3wallet.pair({ uri });

      // After requesting pairing with the DAPP we receive session proposal
      // which we need to approve or reject.
      web3wallet.on('session_proposal', async ({ id, params: proposal }) => {
        const { accounts, chains } = getFormattedAccountsAndChains();
        const methods: SupportedRequestMethod[] = ['personal_sign', 'eth_sendTransaction'];

        monitorActiveSessionEvents();

        try {
          wcSession.value = await web3wallet!.approveSession({
            id,
            namespaces: buildApprovedNamespaces({
              proposal,
              supportedNamespaces: {
                [ETH_CHAIN_NAMESPACE]: {
                  accounts,
                  chains,
                  // approving all the required events
                  events: proposal.requiredNamespaces[ETH_CHAIN_NAMESPACE]?.events || [],
                  methods,
                },
              },
            }),
          });

          monitorActiveAccountAndNetwork();
          closeAppIfOpenUsingDeeplink();
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

  function setIsOpenUsingDeeplink(value: boolean) {
    isOpenUsingDeeplink.value = value;
  }

  if (!composableInitialized) {
    composableInitialized = true;

    // As the session is not important immediately after opening the app we are delaying it
    // until other more important features are ready.
    setTimeout(async () => {
      // Try to restore open WC session:
      // - after refreshing the tab or extension (only once),
      // - in the extension offscreen when the new session state is detected (constant monitoring).
      watch(wcSession, async (session, oldSession) => {
        if (session) {
          if (!web3wallet) {
            web3wallet = await initWeb3wallet();
          }

          const sessions = web3wallet.getActiveSessions();
          const activeTopic = Object.values(sessions)?.[0]?.topic;

          if (!oldSession && activeTopic && activeTopic === session.topic) {
            monitorActiveSessionEvents();

            if (!offscreen) {
              monitorActiveAccountAndNetwork();
            }
          } else {
            disconnect();
          }
        }
      }, { deep: true, immediate: true, once: !offscreen });
    }, 1000);
  }

  return {
    connect,
    disconnect,
    setIsOpenUsingDeeplink,
    wcSession,
    wcState,
    ethAccounts,
  };
}
