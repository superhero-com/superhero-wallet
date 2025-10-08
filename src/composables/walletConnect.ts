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

  function getRequestedChainIdsFromProposal(proposal: any): string[] {
    const extractChains = (ns: any) => (
      ns?.[ETH_CHAIN_NAMESPACE]?.chains || []
    ) as string[];

    const chainsUris = [
      ...extractChains(proposal?.optionalNamespaces),
      ...extractChains(proposal?.requiredNamespaces),
    ];

    const requestedChainIds = uniq(
      chainsUris
        .map((uri) => uri?.split(':')?.[1])
        .filter(Boolean),
    ) as string[];

    return requestedChainIds;
  }

  function getPreferredEvmProtocolFromProposal(proposal: any): Protocol | null {
    const requestedChainIds = new Set(getRequestedChainIdsFromProposal(proposal));
    if (!requestedChainIds.size) return null;

    // Map chainId -> protocol from configured networks
    const chainIdToProtocol: Record<string, Protocol> = {};
    Object.values(networks.value).forEach(({ protocols }) => {
      EVM_PROTOCOLS.forEach((protocol: Protocol) => {
        const chainId = (protocols as any)[protocol]?.chainId?.toString();
        if (!chainId) return;
        if (!chainIdToProtocol[chainId]) {
          chainIdToProtocol[chainId] = protocol;
        }
      });
    });

    const requestedProtocols = new Set<Protocol>(
      [...requestedChainIds]
        .map((id) => chainIdToProtocol[id])
        .filter(Boolean) as Protocol[],
    );

    // 1) If active account protocol is supported, prefer it
    if (EVM_PROTOCOLS.includes(activeAccount.value.protocol)
      && requestedProtocols.has(activeAccount.value.protocol)) {
      return activeAccount.value.protocol;
    }

    // 2) Otherwise, find first wallet account whose protocol is supported
    const protocolWithAccounts = EVM_PROTOCOLS.find((protocol: Protocol) => (
      requestedProtocols.has(protocol)
      && (accountsGroupedByProtocol.value[protocol] || []).length > 0
    ));
    if (protocolWithAccounts) return protocolWithAccounts;

    return null;
  }

  function getSupportedRequestedProtocols(proposal: any): Protocol[] {
    const requestedChainIds = new Set(getRequestedChainIdsFromProposal(proposal));
    if (!requestedChainIds.size) return [];

    const chainIdToProtocol: Record<string, Protocol> = {};
    Object.values(networks.value).forEach(({ protocols }) => {
      EVM_PROTOCOLS.forEach((protocol: Protocol) => {
        const chainId = (protocols as any)[protocol]?.chainId?.toString();
        if (!chainId) return;
        if (!chainIdToProtocol[chainId]) {
          chainIdToProtocol[chainId] = protocol;
        }
      });
    });

    const requestedProtocols = new Set<Protocol>(
      [...requestedChainIds]
        .map((id) => chainIdToProtocol[id])
        .filter(Boolean) as Protocol[],
    );

    return EVM_PROTOCOLS.filter((p) => requestedProtocols.has(p));
  }

  function getFormattedAccountsAndChainsForProtocol(
    preferredProtocol: Protocol,
    proposal: any,
  ) {
    const requestedChainIds = new Set(getRequestedChainIdsFromProposal(proposal));

    const networkList = Object.values(networks.value)
      .sort(({ name }) => (name === activeNetwork.value.name) ? -1 : 1);

    const chainIdsOrdered: string[] = [];
    networkList.forEach(({ protocols }) => {
      const chainId = (protocols as any)[preferredProtocol]?.chainId?.toString();
      if (!chainId) return;
      if (requestedChainIds.size && !requestedChainIds.has(chainId)) return;
      if (!chainIdsOrdered.includes(chainId)) {
        chainIdsOrdered.push(chainId);
      }
    });

    if (!chainIdsOrdered.length) {
      // Fallback to all supported by wallet if intersection is empty
      return getFormattedAccountsAndChains();
    }

    const chains = chainIdsOrdered.map((chainId) => `${ETH_CHAIN_NAMESPACE}:${chainId}`);

    const lastActive = getLastActiveProtocolAccount(preferredProtocol);
    const protocolAccounts = (
      (accountsGroupedByProtocol.value[preferredProtocol] || []) as IAccount[]
    ).sort(({ address }: IAccount) => (address === lastActive?.address) ? -1 : 1);

    const accountsByChain = chainIdsOrdered.map((chainId) => (
      protocolAccounts.map(({ address }) => `${ETH_CHAIN_NAMESPACE}:${chainId}:${address}`)
    ));
    const accounts = accountsByChain.flat();

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
    const unwatch = watch(
      [activeAccount, activeNetwork],
      async ([newAccount], [oldAccount]) => {
        if (!EVM_PROTOCOLS.includes(newAccount.protocol)) return;
        if (!web3wallet || !wcSession.value) { unwatch(); return; }

        const { accounts, chains } = getFormattedAccountsAndChains();

        wcSession.value.namespaces[ETH_CHAIN_NAMESPACE].chains = chains;
        wcSession.value.namespaces[ETH_CHAIN_NAMESPACE].accounts = accounts;

        try {
          const activeProtocols = (networks.value[activeNetwork.value.name].protocols as any);
          const preferredChainIdDec = activeProtocols[newAccount.protocol].chainId.toString();
          const preferredChainId = `${ETH_CHAIN_NAMESPACE}:${preferredChainIdDec}`;

          // Reorder accounts so the active address is first for every chain group
          // Dapps (like Uniswap) often pick the first account for the chain they're using
          const byChain: Record<string, string[]> = {};
          accounts.forEach((acc) => {
            const [, chainId] = acc.split(':');
            if (!byChain[chainId]) byChain[chainId] = [];
            byChain[chainId].push(acc);
          });
          const reorderedAccounts = Object.entries(byChain).flatMap(([chainId, accs]) => {
            const target = `${ETH_CHAIN_NAMESPACE}:${chainId}:${newAccount.address}`;
            const first = accs.filter((a) => a === target);
            const rest = accs.filter((a) => a !== target);
            return [...first, ...rest];
          });
          wcSession.value.namespaces[ETH_CHAIN_NAMESPACE].accounts = reorderedAccounts;

          // Update session first so dapps relying on session_update pick the correct account
          const { acknowledged } = await web3wallet.updateSession({
            topic: wcSession.value.topic,
            namespaces: wcSession.value.namespaces,
          });
          await acknowledged();

          // Emit accountsChanged only when address actually changes
          if (!oldAccount || oldAccount.address !== newAccount.address) {
            await web3wallet.emitSessionEvent({
              topic: wcSession.value.topic,
              event: {
                name: 'accountsChanged',
                data: [newAccount.address],
              },
              chainId: preferredChainId,
            });
          }

          // Keep chain in sync for the selected protocol
          await web3wallet.emitSessionEvent({
            topic: wcSession.value.topic,
            event: {
              name: 'chainChanged',
              data: activeProtocols[newAccount.protocol].chainId,
            },
            chainId: preferredChainId,
          });
        } catch (error) {
          disconnect();
        }
      },
    );
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
        const preferredProtocol = getPreferredEvmProtocolFromProposal(proposal);
        const { accounts, chains } = preferredProtocol
          ? getFormattedAccountsAndChainsForProtocol(preferredProtocol, proposal)
          : getFormattedAccountsAndChains();
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

            const supportedProtocols = getSupportedRequestedProtocols(proposal);
            const displayProtocol = preferredProtocol || supportedProtocols[0];

            await openModal(MODAL_CONFIRM_CONNECT, {
              app,
              icon,
              protocol: displayProtocol || undefined,
              supportsProtocol: supportedProtocols.length > 0,
              supportedProtocols,
            });
          }

          wcSession.value = await web3wallet!.approveSession({
            id,
            namespaces: buildApprovedNamespaces({
              proposal,
              supportedNamespaces: {
                [ETH_CHAIN_NAMESPACE]: {
                  accounts,
                  chains,
                  events: uniq([
                    ...proposal.requiredNamespaces[ETH_CHAIN_NAMESPACE]?.events || [],
                    'accountsChanged',
                    'chainChanged',
                  ]),
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
