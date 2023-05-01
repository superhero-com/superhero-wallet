import { v4 as genUuid } from 'uuid';
import camelcaseKeysDeep from 'camelcase-keys-deep';
import { IMiddlewareWebSocketSubscriptionMessage, WebSocketChannelName } from '../types';
import {
  WEB_SOCKET_CHANNEL_KEY_BLOCKS,
  WEB_SOCKET_CHANNEL_KEY_OBJECT,
  WEB_SOCKET_CHANNEL_MICRO_BLOCKS,
  WEB_SOCKET_CHANNEL_TRANSACTIONS,
  WEB_SOCKET_SUBSCRIBE,
  handleUnknownError,
} from '../popup/utils';

let wsClient: WebSocket;
let isWsConnected: boolean;

const subscribersQueue: IMiddlewareWebSocketSubscriptionMessage[] = [];
// eslint-disable-next-line no-unused-vars
const subscribers:Record<WebSocketChannelName, Record<string, (payload: any) => void>> = {
  [WEB_SOCKET_CHANNEL_TRANSACTIONS]: {},
  [WEB_SOCKET_CHANNEL_MICRO_BLOCKS]: {},
  [WEB_SOCKET_CHANNEL_KEY_BLOCKS]: {},
  [WEB_SOCKET_CHANNEL_KEY_OBJECT]: {},
};

export default class WebSocketClient {
  static handleWebsocketOpen() {
    isWsConnected = true;
    subscribersQueue.forEach((message) => {
      wsClient.send(JSON.stringify(message));
    });
  }

  static handleWebsocketClose() {
    isWsConnected = false;
  }

  static isWsConnected() {
    return isWsConnected;
  }

  static subscribeForChannel(
    message: IMiddlewareWebSocketSubscriptionMessage,
    // eslint-disable-next-line no-unused-vars
    callback: (payload: any) => void,
  ) {
    if (isWsConnected) {
      wsClient.send(JSON.stringify(message));
    }

    subscribersQueue.push(message);

    const uuid = genUuid();
    // const uuid = message.target || genUuid();
    subscribers[message.payload][uuid] = callback;
    return () => {
      delete subscribers[message.payload][uuid];
    };
  }

  // eslint-disable-next-line no-unused-vars
  static subscribeForAccountUpdates(address: string, callback: (payload: any) => void) {
    return WebSocketClient.subscribeForChannel(
      {
        op: WEB_SOCKET_SUBSCRIBE,
        payload: WEB_SOCKET_CHANNEL_KEY_OBJECT,
        target: address,
      },
      callback,
    );
  }

  // eslint-disable-next-line no-unused-vars
  static subscribeForTransactionsUpdates(callback: (payload: any) => void) {
    return WebSocketClient.subscribeForChannel(
      {
        op: WEB_SOCKET_SUBSCRIBE,
        payload: WEB_SOCKET_CHANNEL_TRANSACTIONS,
      },
      callback,
    );
  }

  // eslint-disable-next-line no-unused-vars
  static subscribeForMicroBlocksUpdates(callback: (payload: any) => void) {
    return WebSocketClient.subscribeForChannel(
      {
        op: WEB_SOCKET_SUBSCRIBE,
        payload: WEB_SOCKET_CHANNEL_MICRO_BLOCKS,
      },
      callback,
    );
  }

  // eslint-disable-next-line no-unused-vars
  static subscribeForKeyBlocksUpdates(callback: (payload: any) => void) {
    return WebSocketClient.subscribeForChannel(
      {
        op: WEB_SOCKET_SUBSCRIBE,
        payload: WEB_SOCKET_CHANNEL_KEY_BLOCKS,
      },
      callback,
    );
  }

  static handleWebsocketMessage(message: MessageEvent) {
    if (!message.data) {
      return;
    }
    try {
      const data = camelcaseKeysDeep(JSON.parse(message.data));

      // Call all subscribers for the channel
      Object.values(subscribers[data.subscription as WebSocketChannelName]).forEach(
        (subscriberCb) => subscriberCb(data.payload),
      );
    } catch (error) {
      handleUnknownError(error);
    }
  }

  static disconnect() {
    wsClient.addEventListener('open', WebSocketClient.handleWebsocketOpen);
    wsClient.addEventListener('close', WebSocketClient.handleWebsocketClose);
    wsClient.addEventListener('message', WebSocketClient.handleWebsocketClose);
    wsClient.close();
  }

  static connect(url: string) {
    if (wsClient) {
      WebSocketClient.disconnect();
    }

    wsClient = new WebSocket(url);
    wsClient.addEventListener('open', WebSocketClient.handleWebsocketOpen);
    wsClient.addEventListener('close', WebSocketClient.handleWebsocketClose);
    wsClient.addEventListener('message', WebSocketClient.handleWebsocketMessage);
  }
}
