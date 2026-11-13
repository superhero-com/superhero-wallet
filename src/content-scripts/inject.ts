import type { BackgroundMethod } from '@/types';
import {
  ETH_CONTENT_SCRIPT_METHODS,
  ETH_RPC_METHODS,
  ETH_RPC_WALLET_EVENTS,
} from '@/protocols/ethereum/rpcMethods';
import browser from 'webextension-polyfill';

/** Whether the page asked the wallet anything, so it may hear when the chain changes */
let hasAskedWallet = false;
/** Whether the wallet gave this page accounts, so it may hear when they change */
let hasAccounts = false;

type WalletResponse = { result?: unknown; error?: unknown };

const ERROR_WALLET_UNAVAILABLE: WalletResponse = {
  error: { code: -32603, message: 'Unable to communicate with the wallet. Please try again.' },
};

/**
 * Frames sandboxed without `allow-same-origin` (and `file://` documents) have an
 * opaque origin, which serializes to the literal string `'null'`. That value is
 * not a valid `postMessage` target origin - the API only accepts a real origin,
 * `'*'` or `'/'` - so every message the content script sends into such a frame
 * throws a `SyntaxError`. It is also worthless as a dapp identity: permissions
 * are keyed by host, so every sandboxed frame on the web would share the single
 * `'null'` entry. Stay out of those frames entirely.
 *
 * Read `window.origin`, not `location.origin`: the latter comes from the URL, so a
 * sandboxed `https://platform.twitter.com` frame still reports a real origin there.
 */
const hasOpaqueOrigin = () => !window.origin || window.origin === 'null';

const runContentScript = () => {
  const sendToOffscreen = async (
    method: BackgroundMethod,
    params: object,
  ): Promise<WalletResponse | undefined> => {
    try {
      return await browser.runtime.sendMessage({ target: 'offscreen', method, params });
    } catch {
      // Settle the page's request so the provider can release its pending entry.
      return ERROR_WALLET_UNAVAILABLE;
    }
  };

  function postToPage(data: object) {
    window.postMessage({
      jsonrpc: '2.0',
      superheroWalletApproved: true,
      type: 'result',
      ...data,
    }, window.origin);
  }

  async function getWalletResponse(method: unknown, params: unknown): Promise<WalletResponse> {
    // A `String` object slips past the checks below and turns into a string on the way out
    if (typeof method !== 'string') {
      return { error: { code: -32600, message: 'The method must be a string' } };
    }
    // Its answer is for this script, a page asking it would learn the active account
    if (Object.values(ETH_CONTENT_SCRIPT_METHODS).includes(method as any)) {
      return { error: { code: -32004, message: `Method "${method}" is not supported` } };
    }
    const response = await sendToOffscreen(method as BackgroundMethod, {
      rpcMethodParams: params,
      aepp: window.origin,
    }) ?? ERROR_WALLET_UNAVAILABLE;
    hasAskedWallet = true;
    if (
      (method === ETH_RPC_METHODS.requestAccounts || method === ETH_RPC_METHODS.getAccounts)
      && Array.isArray(response.result) && response.result.length
    ) {
      hasAccounts = true;
    }
    if (method === ETH_RPC_METHODS.revokePermissions && !response.error) {
      hasAccounts = false;
    }
    return response;
  }

  // Requests of the inpage provider, the page posts other messages too
  window.addEventListener('message', async (event) => {
    if (event.origin !== window.origin || event.source !== window) return;
    if (!event.data?.superheroWalletRequest) return;
    const { method, params, requestId } = event.data;
    const { result, error } = await getWalletResponse(method, params);
    postToPage({
      result,
      ...(error ? { error } : {}),
      method,
      requestId,
    });
  });

  function postWalletEvent(method: string, result: unknown) {
    if (hasAskedWallet) {
      postToPage({ result, method });
    }
  }

  browser.runtime.onMessage.addListener(({ method, result }: any): undefined => {
    if (method === ETH_RPC_WALLET_EVENTS.chainChanged) {
      postWalletEvent(method, result);
    } else if (method === ETH_RPC_WALLET_EVENTS.accountsChanged && hasAccounts) {
      // The page may see only the accounts it is permitted: a site removed meanwhile gets no
      // accounts and no further events.
      sendToOffscreen(ETH_CONTENT_SCRIPT_METHODS.getPermittedAccounts, {})
        .then((response) => {
          // A transport failure does not mean the site's permission was revoked.
          if (response?.error) return;
          const permittedAccounts = Array.isArray(response?.result) ? response.result : [];
          if (!permittedAccounts.length) {
            hasAccounts = false;
          }
          postWalletEvent(method, permittedAccounts);
        });
    }
    return undefined;
  });

  /**
   * Aex-2 aepp communication, as the SDK's `connectionProxy` of a
   * `BrowserWindowMessageConnection` and a `BrowserRuntimeConnection`.
   * Importing those put 47 KB, mostly core-js, into every frame.
   */
  function relayAeppMessages() {
    const port = browser.runtime.connect();
    function onPageMessage({ data, origin, source }: MessageEvent) {
      if ((data?.jsonrpc ?? data?.data?.jsonrpc) !== '2.0') return;
      if (origin !== window.origin || source !== window) return;
      if (data.type != null && data.type !== 'to_waellet') return;
      port.postMessage(data.type != null ? data.data : data);
    }
    window.addEventListener('message', onPageMessage);
    port.onMessage.addListener((message) => {
      window.postMessage({ type: 'to_aepp', data: message }, window.origin);
    });
    port.onDisconnect.addListener(() => window.removeEventListener('message', onPageMessage));
  }

  if (document.readyState === 'complete') {
    relayAeppMessages();
  } else {
    const onReadyStateChange = () => {
      if (document.readyState !== 'complete') return;
      document.removeEventListener('readystatechange', onReadyStateChange, true);
      relayAeppMessages();
    };
    document.addEventListener('readystatechange', onReadyStateChange, true);
  }
};

if (!hasOpaqueOrigin()) {
  runContentScript();
}
