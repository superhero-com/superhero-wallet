import { effectScope, watch } from 'vue';
import { RPC_STATUS } from '@aeternity/aepp-sdk';

import type { AeSdkSuperhero } from '@/protocols/aeternity/libs/AeSdkSuperhero';
import { executeAndSetInterval, handleUnknownError } from '@/utils';
import { ETH_RPC_METHODS, ETH_RPC_WALLET_EVENTS } from '@/protocols/ethereum/config';
import { handleEvmRpcMethod, handleEvmRpcRequest } from '@/protocols/evm/libs/EvmRpcMethodsHandler';
import { SUPERHERO_EIP6963_PROVIDER_INFO } from '@/content-scripts/eip6963ProviderInfo';
// eslint-disable-next-line import/extensions
import providerScript from '@/content-scripts/inAppBrowserProvider.js?raw';

import { useAccounts } from './accounts';
import { useAeSdk } from './aeSdk';
import { useAuth } from './auth';
import { useModals } from './modals';
import { useNetworks } from './networks';
import { usePermissions } from './permissions';
import { useWalletConnect, type WalletConnectUri } from './walletConnect';

/** The part of `cordova-plugin-inappbrowser` used here. */
interface IInAppBrowser {
  addEventListener(
    type: 'beforeload',
    listener: (event: { url: string }, load: (url: string) => void) => void,
  ): void;
  addEventListener(type: 'loadstop', listener: (event: { url: string }) => void): void;
  addEventListener(type: 'message', listener: (event: { data: any }) => void): void;
  addEventListener(type: 'exit', listener: () => void): void;
  executeScript(details: { code: string }): void;
  show(): void;
  hide(): void;
  close(): void;
}

interface ISession {
  token: string;
  origin: string;
}

type AeppConnection = Parameters<AeSdkSuperhero['addRpcClient']>[0];

/** `beforeload` lets WalletConnect links start the wallet's own pairing. */
const BROWSER_OPTIONS = 'beforeload=get,zoomcontrols=no';
const SESSION_PLACEHOLDER = "'__SUPERHERO_SESSION__'";
const AEPP_ANNOUNCE_INTERVAL = 3000;

function getWalletConnectUri(url: string): WalletConnectUri | undefined {
  const uri = url.startsWith('superhero://wc') ? new URL(url).searchParams.get('uri') : url;
  return uri?.startsWith('wc:') ? uri as WalletConnectUri : undefined;
}

let closeOpenBrowser: (() => void) | undefined;

export function useInAppBrowser() {
  const { getAeSdk } = useAeSdk();
  const { activeAccount } = useAccounts();
  const { isAuthenticated } = useAuth();
  const { modalsOpen } = useModals();
  const { activeNetwork } = useNetworks();
  const { permissions } = usePermissions();
  const { connect, wcSession } = useWalletConnect();

  function openInAppBrowser(appUrl: string) {
    closeOpenBrowser?.();
    const browser: IInAppBrowser = (window as any).cordova.InAppBrowser
      .open(appUrl, '_blank', BROWSER_OPTIONS);
    const scope = effectScope();
    /** Bound to the document the provider was injected into, see `inAppBrowserProvider.js`. */
    let session: ISession | undefined;
    let pendingSession: ISession | undefined;
    let aeppClient: { sdk: AeSdkSuperhero; id: string } | undefined;
    let aeppGeneration = 0;
    let onAeppMessage: ((message: any, origin: string, source?: any) => void) | undefined;
    let announceInterval: ReturnType<typeof setInterval> | undefined;
    let evmState = { accounts: [] as string[], chainId: '' };

    function close() {
      browser.close();
    }

    function postToPage(origin: string, message: object) {
      const targetOrigin = JSON.stringify(origin);
      // Checked before calling anything the page could override.
      browser.executeScript({
        code: `window.location.origin === ${targetOrigin} && window.postMessage(${JSON.stringify(message)}, ${targetOrigin});`,
      });
    }

    function disconnectAepp() {
      aeppGeneration += 1;
      clearInterval(announceInterval);
      onAeppMessage = undefined;
      if (aeppClient) {
        const { sdk, id } = aeppClient;
        aeppClient = undefined;
        sdk.removeRpcClient(id);
      }
    }

    function addAeppClient(sdk: AeSdkSuperhero, origin: string) {
      let onDisconnect: (() => void) | undefined;
      const connection = {
        connect(messageHandler: typeof onAeppMessage, disconnectHandler: () => void) {
          onAeppMessage = messageHandler;
          onDisconnect = disconnectHandler;
        },
        disconnect() {
          // `disconnectAepp` forgets the client before removing it.
          const isClosedByAepp = !!aeppClient;
          clearInterval(announceInterval);
          onAeppMessage = undefined;
          aeppClient = undefined;
          onDisconnect?.();
          // Let the aepp connect again without reloading the page.
          if (isClosedByAepp) addAeppClient(sdk, origin);
        },
        isConnected: () => !!onAeppMessage,
        sendMessage: (message: any) => postToPage(origin, { type: 'to_aepp', data: message }),
      };
      const id = sdk.addRpcClient(connection as unknown as AeppConnection);
      aeppClient = { sdk, id };
      announceInterval = executeAndSetInterval(() => {
        if (sdk._getClient(id).status === RPC_STATUS.WAITING_FOR_CONNECTION_REQUEST) {
          sdk.shareWalletInfo(id);
        } else {
          clearInterval(announceInterval);
        }
      }, AEPP_ANNOUNCE_INTERVAL);
    }

    async function connectAepp(origin: string) {
      disconnectAepp();
      const generation = aeppGeneration;
      const sdk = await getAeSdk();
      if (generation === aeppGeneration) addAeppClient(sdk, origin);
    }

    async function readEvmState(origin: string) {
      const [{ result: accounts }, { result: chainId }] = await Promise.all([
        handleEvmRpcMethod(origin, ETH_RPC_METHODS.getAccounts, {}),
        handleEvmRpcMethod(origin, ETH_RPC_METHODS.getChainId, {}),
      ]);
      return { accounts, chainId };
    }

    async function emitEvmChanges() {
      if (!session) return;
      const { origin } = session;
      const { accounts, chainId } = await readEvmState(origin);
      if (session?.origin !== origin) return;
      const emit = (event: string, data: any) => postToPage(
        origin,
        { superheroInAppBrowser: 'event', event, data },
      );
      if (chainId !== evmState.chainId) emit(ETH_RPC_WALLET_EVENTS.chainChanged, chainId);
      if (accounts.join() !== evmState.accounts.join()) {
        emit(ETH_RPC_WALLET_EVENTS.accountsChanged, accounts);
      }
      evmState = { accounts, chainId };
    }

    async function startSession(newSession: ISession, isNewDocument: boolean) {
      // The page can claim to be the same document, but not the origin
      const isSameDocument = !isNewDocument && session?.origin === newSession.origin;
      session = newSession;
      if (isSameDocument && aeppClient) return;
      await connectAepp(newSession.origin);
      evmState = await readEvmState(newSession.origin);
    }

    async function handleEvmRequest(origin: string, { id, method, params }: any) {
      const response = await handleEvmRpcRequest(origin, method, params);
      postToPage(origin, { superheroInAppBrowser: 'response', id, ...response });
    }

    browser.addEventListener('loadstop', ({ url }) => {
      const { origin, protocol } = new URL(url);
      if (protocol !== 'https:' && protocol !== 'http:') return;
      pendingSession = { token: crypto.randomUUID(), origin };
      const config = JSON.stringify({
        ...pendingSession,
        providerInfo: SUPERHERO_EIP6963_PROVIDER_INFO,
      });
      browser.executeScript({ code: providerScript.replace(SESSION_PLACEHOLDER, () => config) });
    });

    browser.addEventListener('message', ({ data }) => {
      if (pendingSession && data.kind === 'ready' && data.token === pendingSession.token) {
        startSession(pendingSession, data.isNew).catch(handleUnknownError);
        pendingSession = undefined;
      } else if (session && data.token === session.token) {
        if (data.kind === 'aepp' && data.data?.jsonrpc === '2.0') {
          onAeppMessage?.(data.data, session.origin);
        }
        if (data.kind === 'request') {
          handleEvmRequest(session.origin, data).catch(handleUnknownError);
        }
      }
    });

    browser.addEventListener('beforeload', ({ url }, load) => {
      const walletConnectUri = getWalletConnectUri(url);
      if (walletConnectUri) {
        if (!wcSession.value) connect(walletConnectUri, true);
      } else if (/^https?:/.test(url)) {
        load(url);
      }
    });

    browser.addEventListener('exit', () => {
      scope.stop();
      disconnectAepp();
      session = undefined;
      pendingSession = undefined;
      if (closeOpenBrowser === close) closeOpenBrowser = undefined;
    });

    scope.run(() => {
      // Confirmation modals open in the wallet underneath the browser.
      watch(
        () => modalsOpen.value.length > 0,
        (isModalOpen) => (isModalOpen ? browser.hide() : browser.show()),
      );
      watch(isAuthenticated, (value) => !value && close());
      watch(
        [() => activeAccount.value.globalIdx, () => activeNetwork.value.name, permissions],
        () => emitEvmChanges().catch(handleUnknownError),
        { deep: true },
      );
    });

    closeOpenBrowser = close;
  }

  return { openInAppBrowser };
}
