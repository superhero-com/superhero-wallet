import {
  BrowserRuntimeConnection,
  BrowserWindowMessageConnection,
  MESSAGE_DIRECTION,
  connectionProxy,
} from '@aeternity/aepp-sdk';

import type { BackgroundMethod } from '@/types';
import {
  ETH_CONTENT_SCRIPT_METHODS,
  ETH_RPC_METHODS,
  ETH_RPC_NODE_METHODS,
  ETH_RPC_WALLET_EVENTS,
} from '@/protocols/ethereum/config';
import browser from 'webextension-polyfill';

const connectedDapps: Record<string, any> = {};
/** Whether the wallet gave this page accounts, so it may hear when they change */
let hasAccounts = false;

window.browser = browser;

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
  const sendToOffscreen = (method: BackgroundMethod, params: any) => new Promise((resolve) => {
    browser.runtime
      .sendMessage({
        target: 'offscreen',
        jsonrpc: '2.0',
        id: params.id || null,
        method,
        params,
      })
      .then((res) => resolve(res));
  });

  async function handleEthRpcRequest(
    event: any,
    method: BackgroundMethod,
    params: unknown,
  ) {
    const { result, error }: any = await sendToOffscreen(method, {
      rpcMethodParams: params,
      aepp: event.origin,
    });
    if (!connectedDapps[event.origin]) {
      connectedDapps[event.origin] = event.source;
    }
    if (
      (method === ETH_RPC_METHODS.requestAccounts || method === ETH_RPC_METHODS.getAccounts)
      && Array.isArray(result) && result.length
    ) {
      hasAccounts = true;
    }
    if (method === ETH_RPC_METHODS.revokePermissions && !error) {
      hasAccounts = false;
    }
    event.source.postMessage({
      jsonrpc: '2.0',
      result,
      ...(error ? { error } : {}),
      method: event.data.method,
      superheroWalletApproved: true,
      type: 'result',
      requestId: event.data.requestId,
    }, event.origin);
  }

  // Subscribe from postMessages from page
  window.addEventListener(
    'message',
    async (event) => {
      if (event.origin !== window.origin || event.source !== window) {
        return;
      }
      if (event.data?.type === 'result') {
        return;
      }
      let { method } = event.data;
      if (!method) method = 'pageMessage';
      // A `String` object slips past the checks below and turns into a string on the way out
      if (typeof method !== 'string') return;
      // Its answer is for this script, a page asking it would learn the active account
      if (Object.values(ETH_CONTENT_SCRIPT_METHODS).includes(method as any)) return;

      if (
        event.data.superheroWalletRequest
        || Object.values(ETH_RPC_METHODS).includes(method)
        || Object.values(ETH_RPC_NODE_METHODS).includes(method)
      ) {
        handleEthRpcRequest(event, method, event.data.params);
      } else if (!event.data.resolve) {
        sendToOffscreen(method, event.data);
      }
    },
    false,
  );
  function postWalletEvent(method: string, result: unknown) {
    Object.entries(connectedDapps).forEach(([origin, source]) => {
      source.postMessage({
        jsonrpc: '2.0',
        result,
        method,
        superheroWalletApproved: true,
        type: 'result',
      }, origin as any);
    });
  }

  browser.runtime.onMessage.addListener(({ method, result }: any): undefined => {
    if (method === ETH_RPC_WALLET_EVENTS.chainChanged) {
      postWalletEvent(method, result);
    } else if (method === ETH_RPC_WALLET_EVENTS.accountsChanged && hasAccounts) {
      // The page may see only the accounts it is permitted: a site removed meanwhile gets no
      // accounts and no further events.
      sendToOffscreen(ETH_CONTENT_SCRIPT_METHODS.getPermittedAccounts, {})
        .then((response: any) => {
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
   * Aex-2 Aepp communication
   */
  const readyStateCheckInterval = setInterval(() => {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);
      const port = browser.runtime.connect();
      const extConnection = new BrowserRuntimeConnection({ port, debug: false });
      const pageConnection = new BrowserWindowMessageConnection({
        target: window,
        origin: window.origin,
        sendDirection: MESSAGE_DIRECTION.to_aepp,
        receiveDirection: MESSAGE_DIRECTION.to_waellet,
      });
      connectionProxy(pageConnection, extConnection);
    }
  }, 10);
};

if (!hasOpaqueOrigin()) {
  runContentScript();
}
