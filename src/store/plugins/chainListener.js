import { TOKEN_TEST_CONTRACT } from '../../popup/utils/constants';

export default (store) => {
  let wsconnection = null;
  const subscribeToContract = (contract) => {
    wsconnection.send(JSON.stringify({
      op: 'Subscribe',
      payload: 'Object',
      target: contract,
    }));
  };

  const connectToWebsocket = (websocketUrl) => {
    wsconnection = new WebSocket(websocketUrl);
  };

  const handleWebsocketMessage = async (message) => {
    const data = JSON.parse(message.data);
    if (data.subscription === 'Object') {
      store.dispatch('transactionCache/decode', data.payload);
    }
  };

  const handleConnectionInit = async () => {
    // eslint-disable-next-line no-console
    console.info('WebSocket connected');
    subscribeToContract(TOKEN_TEST_CONTRACT);
    wsconnection.onmessage = handleWebsocketMessage;
    wsconnection.onerror = (error) => {
      // eslint-disable-next-line no-console
      console.error(`Connection Error: ${error.toString()}`);
    };
    wsconnection.onClose = (closeCode, closeReason) => {
      if (closeCode === 1006) {
        connectToWebsocket();
      } else {
        // eslint-disable-next-line no-console
        console.error(`Websocket closed with code: ${closeCode} and reason: ${closeReason}`);
      }
    };
  };

  store.watch(
    ({ middleware }) => middleware,
    (middleware) => {
      if (!middleware) return;

      const { middlewareUrl } = store.getters.activeNetwork;
      const websocketUrl = new URL(middlewareUrl);
      websocketUrl.protocol = websocketUrl.protocol === 'https:' ? 'wss' : 'ws';
      websocketUrl.pathname += '/websocket';
      if (wsconnection) wsconnection.close();
      connectToWebsocket(websocketUrl);
      wsconnection.onopen = handleConnectionInit;
    },
    { immediate: true },
  );
};
