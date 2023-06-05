/* eslint-disable class-methods-use-this */
import { v4 as genUuid } from 'uuid';
import camelcaseKeysDeep from 'camelcase-keys-deep';
import type {
  IMiddlewareWebSocketSubscriptionMessage,
  ITopHeader,
  ITransaction,
  WebSocketChannelName,
} from '../types';
import {
  WEB_SOCKET_CHANNELS,
  WEB_SOCKET_SUBSCRIBE,
  WEB_SOCKET_UN_SUBSCRIBE,
  handleUnknownError,
} from '../popup/utils';

let wsClient: WebSocket;
let isWsConnected: boolean;

const subscribersQueue: IMiddlewareWebSocketSubscriptionMessage[] = [];

const subscribers: Record<WebSocketChannelName, Record<string, (
  payload: ITransaction | ITopHeader
) => void>> = {
  [WEB_SOCKET_CHANNELS.Transactions]: {},
  [WEB_SOCKET_CHANNELS.MicroBlocks]: {},
  [WEB_SOCKET_CHANNELS.KeyBlocks]: {},
  [WEB_SOCKET_CHANNELS.Object]: {},
};

class WebSocketClient {
  private static instance: WebSocketClient;

  static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }

  private handleWebsocketOpen() {
    isWsConnected = true;
    subscribersQueue.forEach((message) => {
      wsClient.send(JSON.stringify(message));
    });
  }

  private handleWebsocketClose() {
    isWsConnected = false;
  }

  isConnected(): boolean {
    return isWsConnected;
  }

  subscribeForChannel(
    message: IMiddlewareWebSocketSubscriptionMessage,
    callback: (payload: any) => void,
  ) {
    if (isWsConnected) {
      wsClient.send(JSON.stringify(message));
    }

    subscribersQueue.push(message);

    const uuid = genUuid();
    subscribers[message.payload][uuid] = callback;
    return () => {
      delete subscribers[message.payload][uuid];
    };
  }

  subscribeForAccountUpdates(address: string, callback: (payload: ITransaction) => void) {
    return this.subscribeForChannel(
      {
        op: WEB_SOCKET_SUBSCRIBE,
        payload: WEB_SOCKET_CHANNELS.Object,
        target: address,
      },
      callback,
    );
  }

  subscribeForTransactionsUpdates(callback: (payload: ITransaction) => void) {
    return this.subscribeForChannel(
      {
        op: WEB_SOCKET_SUBSCRIBE,
        payload: WEB_SOCKET_CHANNELS.Transactions,
      },
      callback,
    );
  }

  subscribeForMicroBlocksUpdates(callback: (payload: ITopHeader) => void) {
    return this.subscribeForChannel(
      {
        op: WEB_SOCKET_SUBSCRIBE,
        payload: WEB_SOCKET_CHANNELS.MicroBlocks,
      },
      callback,
    );
  }

  subscribeForKeyBlocksUpdates(callback: (payload: ITopHeader) => void) {
    return this.subscribeForChannel(
      {
        op: WEB_SOCKET_SUBSCRIBE,
        payload: WEB_SOCKET_CHANNELS.KeyBlocks,
      },
      callback,
    );
  }

  private handleWebsocketMessage(message: MessageEvent) {
    if (!message.data) {
      return;
    }
    try {
      const data = camelcaseKeysDeep(JSON.parse(message.data));

      if (!data.payload) {
        return;
      }

      // Call all subscribers for the channel
      Object.values(subscribers[data.subscription as WebSocketChannelName]).forEach(
        (subscriberCb) => subscriberCb(data.payload),
      );
    } catch (error) {
      handleUnknownError(error);
    }
  }

  disconnect() {
    subscribersQueue.forEach((message) => {
      wsClient.send(
        JSON.stringify({
          ...message,
          op: WEB_SOCKET_UN_SUBSCRIBE,
        }),
      );
    });
    wsClient.close();
    wsClient.removeEventListener('open', this.handleWebsocketOpen);
    wsClient.removeEventListener('close', this.handleWebsocketClose);
    wsClient.removeEventListener('message', this.handleWebsocketClose);
  }

  connect(url: string) {
    if (wsClient) {
      this.disconnect();
    }

    wsClient = new WebSocket(url);
    wsClient.addEventListener('open', this.handleWebsocketOpen);
    wsClient.addEventListener('close', this.handleWebsocketClose);
    wsClient.addEventListener('message', this.handleWebsocketMessage);
  }
}

export default WebSocketClient.getInstance();
