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
  MODAL_CONFIRM_CONNECT,
  PROTOCOLS,
  STORAGE_KEYS,
  WALLET_CONNECT_PROJECT_ID,
  EVM_PROTOCOLS,
} from '@/constants';
import { tg } from '@/popup/plugins/i18n';

import { ETH_CHAIN_NAMESPACE, ETH_RPC_METHODS, ETH_RPC_ETHERSCAN_PROXY_METHODS } from '@/protocols/ethereum/config';
import type { EthRpcSupportedMethods } from '@/protocols/ethereum/types';
import type { Protocol, IAccount } from '@/types';
import { handleEvmRpcMethod } from '@/protocols/evm/libs/EvmRpcMethodsHandler';

import { useAccounts } from './accounts';
import { useModals } from './modals';
import { useStorageRef } from './storageRef';
import { useNetworks } from './networks';

export type WalletConnectUri = `wc:${string}`;

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
  const { openDefaultModal, openModal } = useModals();

  const ethAccounts = computed(() => accountsGroupedByProtocol.value[PROTOCOLS.ethereum] || []);
  const evmAccounts = computed(() => (
    EVM_PROTOCOLS
      .map((p) => accountsGroupedByProtocol.value[p] || [])
      .flat()
  ));

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
    const networkList = Object.values(networks.value)
      .sort(({ name }) => (name === activeNetwork.value.name) ? -1 : 1);

    const chainIdsOrdered: string[] = [];
    const chainIdToProtocol: Record<string, Protocol> = {};

    networkList.forEach(({ protocols }) => {
      EVM_PROTOCOLS.forEach((protocol: Protocol) => {
        const chainId = (protocols as any)[protocol]?.chainId?.toString();
        if (!chainId) return;
        if (!chainIdToProtocol[chainId]) {
          chainIdToProtocol[chainId] = protocol;
          chainIdsOrdered.push(chainId);
        }
      });
    });

    const chains = chainIdsOrdered.map((chainId) => `${ETH_CHAIN_NAMESPACE}:${chainId}`);

    const accounts = chainIdsOrdered.map((chainId) => {
      const protocol = chainIdToProtocol[chainId] as Protocol;
      const lastActive = getLastActiveProtocolAccount(protocol);
      const protocolAccounts = ((accountsGroupedByProtocol.value[protocol] || []) as IAccount[])
        .sort(({ address }: IAccount) => (address === lastActive?.address) ? -1 : 1);
      return protocolAccounts.map(({ address }: IAccount) => `${ETH_CHAIN_NAMESPACE}:${chainId}:${address}`);
    }).flat();

    return { chains, accounts };
  }

  function monitorActiveSessionEvents() {
    // Connected DAPP requested action, e.g.: signing
    web3wallet?.on('session_request', async ({ topic, params: proposal, id }) => {
      const { url, name } = wcSession.value?.peer.metadata! || {};
      const { result, error } = await handleEvmRpcMethod(
        url,
        proposal.request.method as EthRpcSupportedMethods,
        proposal.request.method === ETH_RPC_METHODS.signPersonal
          ? { data: proposal.request.params[0] }
          : proposal.request.params[0],
        name,
        proposal.chainId,
      );

      try {
        const activeSessions = web3wallet!.getActiveSessions?.() || {} as any;
        if (!activeSessions[topic]) {
          // Session is no longer active; skip responding to avoid throwing
          return;
        }
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
      } catch (e) {
        // Ignore if topic invalid; session likely closed concurrently
      }
      closeAppIfOpenUsingDeeplink();
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
      if (!EVM_PROTOCOLS.includes(newAccount.protocol)) {
        return;
      }
      if (web3wallet && wcSession.value) {
        const { accounts, chains } = getFormattedAccountsAndChains();

        wcSession.value.namespaces[ETH_CHAIN_NAMESPACE].chains = chains;
        wcSession.value.namespaces[ETH_CHAIN_NAMESPACE].accounts = accounts;

        try {
          const activeProtocols = (networks.value[activeNetwork.value.name].protocols as any);
          const preferredChainId = `${ETH_CHAIN_NAMESPACE}:${activeProtocols[newAccount.protocol].chainId}`;
          await web3wallet.emitSessionEvent({
            topic: wcSession.value.topic,
            event: {
              name: 'accountsChanged',
              data: [newAccount.address],
            },
            chainId: preferredChainId,
          });

          await web3wallet.emitSessionEvent({
            topic: wcSession.value.topic,
            event: {
              name: 'chainChanged',
              data: activeProtocols[newAccount.protocol].chainId,
            },
            chainId: preferredChainId,
          });

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
  async function connect(uri: WalletConnectUri, isConfirmRequired: boolean = false) {
    wcState.connecting = true;

    try {
      if (!web3wallet) {
        web3wallet = await initWeb3wallet();
      }
      let proposalHandled = false;
      web3wallet.on('session_proposal', async ({ id, params: proposal }) => {
        if (proposalHandled) return;
        proposalHandled = true;
        const { accounts, chains } = getFormattedAccountsAndChains();
        const requestedMethods = proposal.requiredNamespaces[ETH_CHAIN_NAMESPACE]?.methods || [];
        const baseMethods = [
          ETH_RPC_METHODS.requestAccounts,
          ETH_RPC_METHODS.getAccounts,
          ETH_RPC_METHODS.getChainId,
          ETH_RPC_METHODS.getBlockNumber,
          ETH_RPC_METHODS.signPersonal,
          ETH_RPC_METHODS.sendTransaction,
          // common proxy calls often used by dapps
          ETH_RPC_ETHERSCAN_PROXY_METHODS.estimateGas,
          ETH_RPC_ETHERSCAN_PROXY_METHODS.getTransactionCount,
          ETH_RPC_ETHERSCAN_PROXY_METHODS.gasPrice,
          // EIP-5792
          'wallet_getCapabilities' as any,
        ];
        const methods = uniq([
          ...requestedMethods,
          ...baseMethods,
        ]) as SupportedRequestMethod[];

        try {
          if (isConfirmRequired) {
            const app = new URL(proposal.proposer.metadata.url);
            const { icons } = proposal.proposer.metadata;
            const icon = icons?.[0] ?? '';

            await openModal(MODAL_CONFIRM_CONNECT, { app, icon });
          }

          wcSession.value = await web3wallet!.approveSession({
            id,
            namespaces: buildApprovedNamespaces({
              proposal,
              supportedNamespaces: {
                [ETH_CHAIN_NAMESPACE]: {
                  accounts,
                  chains,
                  events: uniq([...proposal.requiredNamespaces[ETH_CHAIN_NAMESPACE]?.events || [], 'accountsChanged']),
                  methods,
                },
              },
            }),
          });

          // Attach listeners only after session is approved
          monitorActiveSessionEvents();
          monitorActiveAccountAndNetwork();
          closeAppIfOpenUsingDeeplink();
        } catch (error: any) {
          web3wallet!.rejectSession({ id, reason: getSdkError('USER_REJECTED') });
          handleConnectionError(error);
        } finally {
          wcState.connecting = false;
        }
      });

      // Ask the DAPP to send `session_proposal` event.
      await web3wallet.pair({ uri });
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
      watch(wcSession, async (session) => {
        if (session) {
          if (!web3wallet) {
            web3wallet = await initWeb3wallet();
          }

          const sessions = web3wallet.getActiveSessions();
          const activeTopic = Object.values(sessions)?.[0]?.topic;

          if (activeTopic && activeTopic === session.topic) {
            monitorActiveSessionEvents();
            monitorActiveAccountAndNetwork();
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
    evmAccounts,
  };
}
