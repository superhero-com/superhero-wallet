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
        // eslint-disable-next-line no-use-before-define
        connectToWebsocket();
      } else {
        // eslint-disable-next-line no-console
        console.error(`Websocket closed with code: ${closeCode} and reason: ${closeReason}`);
      }
    };
  };
  const { middlewareUrl } = store.getters.activeNetwork;
  const websocketUrl = new URL(middlewareUrl);
  websocketUrl.protocol = websocketUrl.protocol === 'https:' ? 'wss' : 'ws';
  websocketUrl.pathname += '/websocket';

  const connectToWebsocket = () => {
    wsconnection = new WebSocket(websocketUrl);
  };
  connectToWebsocket();
  wsconnection.onopen = handleConnectionInit;
};
