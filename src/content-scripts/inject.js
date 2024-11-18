import {
  BrowserRuntimeConnection,
  BrowserWindowMessageConnection,
  MESSAGE_DIRECTION,
  connectionProxy,
} from '@aeternity/aepp-sdk';

window.browser = require('webextension-polyfill');

const runContentScript = () => {
  const sendToOffscreen = (method, params) => new Promise((resolve) => {
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

  async function handleEthRpcRequest(event, method, params) {
    const result = await sendToOffscreen(method, {
      rpcMethodParams: params,
      aepp: event.origin,
    });
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

      switch (method) {
        case 'eth_getBalance':
          handleEthRpcRequest(event, method, { address: event.data.params[0] });
          break;
        case 'eth_blockNumber':
        case 'eth_chainId':
        case 'eth_accounts':
        case 'eth_requestAccounts':
        case 'wallet_requestPermissions':
        case 'wallet_revokePermissions':
          handleEthRpcRequest(event, method, event.data.params?.[0]);
          break;
        case 'eth_call':
        case 'wallet_switchEthereumChain':
        case 'eth_sendTransaction':
          handleEthRpcRequest(event, method, {
            ...event.data.params[0],
            tag: event.data.params[1],
          });
          break;
        default:
          if (!event.data.resolve) {
            sendToOffscreen(method, event.data);
          }
          break;
      }
    },
    false,
  );

  /**
   * Aex-2 Aepp communication
   */
  const readyStateCheckInterval = setInterval(() => {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);
      const port = browser.runtime.connect();
      const extConnection = new BrowserRuntimeConnection({ port });
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
