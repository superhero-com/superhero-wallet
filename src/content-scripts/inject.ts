import {
  BrowserRuntimeConnection,
  BrowserWindowMessageConnection,
  MESSAGE_DIRECTION,
  connectionProxy,
} from '@aeternity/aepp-sdk';

import type { IEthRpcMethodParameters } from '@/protocols/ethereum/types';
import type { BackgroundMethod } from '@/types';
import {
  ETH_RPC_ETHERSCAN_PROXY_METHODS,
  ETH_RPC_METHODS,
  ETH_RPC_WALLET_EVENTS,
} from '@/protocols/ethereum/config';

const connectedDapps: Record<string, any> = {};

window.browser = require('webextension-polyfill');

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
    params: IEthRpcMethodParameters,
  ) {
    const result = await sendToOffscreen(method, {
      rpcMethodParams: params,
      aepp: event.origin,
    });
    if (!connectedDapps[event.origin]) {
      connectedDapps[event.origin] = event.source;
    }
    event.source.postMessage({
      jsonrpc: '2.0',
      result,
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
      if (event.data.type === 'result') {
        return;
      }
      let { method } = event.data;
      if (!method) method = 'pageMessage';

      if (method === ETH_RPC_METHODS.getBalance) {
        handleEthRpcRequest(event, method, { address: event.data.params[0] });
      } else if (
        Object.values(ETH_RPC_METHODS).includes(method)
        || Object.values(ETH_RPC_ETHERSCAN_PROXY_METHODS).includes(method)
      ) {
        handleEthRpcRequest(event, method, {
          ...(event.data.params?.[0] || {}),
          ...(event.data.params?.[1] && !event.data.params?.[0]?.tag
            ? { tag: event.data.params[1] } : {}),
        });
      } else if (!event.data.resolve) {
        sendToOffscreen(method, event.data);
      }
    },
    false,
  );
  browser.runtime.onMessage.addListener(({ method, result }: any): undefined => {
    if (method === ETH_RPC_WALLET_EVENTS.chainChanged) {
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

runContentScript();
