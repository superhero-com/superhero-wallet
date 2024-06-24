/* eslint-disable class-methods-use-this */
import { v4 as genUuid } from 'uuid';
import camelcaseKeysDeep from 'camelcase-keys-deep';
import {
  AE_NETWORK_ADDITIONAL_SETTINGS,
  WEB_SOCKET_SOURCE,
  WEB_SOCKET_CHANNELS,
  WEB_SOCKET_SUBSCRIBE,
  WEB_SOCKET_UNSUBSCRIBE,
  WEB_SOCKET_RECONNECT_TIMEOUT,
} from '@/protocols/aeternity/config';
import { handleUnknownError } from '@/utils';
import { NETWORK_TYPE_MAINNET } from '@/constants';
import type {
  IMiddlewareWebSocketSubscriptionMessage,
  ITopHeader,
  ITransaction,
  WebSocketChannelName,
} from '../types';

class WebSocketClient {
  // eslint-disable-next-line no-use-before-define
  private static instance: WebSocketClient;

  wsClient: WebSocket = new WebSocket(
    AE_NETWORK_ADDITIONAL_SETTINGS[NETWORK_TYPE_MAINNET].websocketUrl,
  );

  isWsConnected: boolean = false;

  subscribersQueue: IMiddlewareWebSocketSubscriptionMessage[] = [];

  subscribers: Record<WebSocketChannelName, Record<string, (
    payload: ITransaction | ITopHeader
  ) => void>> = {
      [WEB_SOCKET_CHANNELS.Transactions]: {},
      [WEB_SOCKET_CHANNELS.MicroBlocks]: {},
      [WEB_SOCKET_CHANNELS.KeyBlocks]: {},
      [WEB_SOCKET_CHANNELS.Object]: {},
    };

  handleWebsocketOpen() {
    this.isWsConnected = true;
    try {
      this.subscribersQueue.forEach((message) => {
        this.wsClient.send(JSON.stringify(message));
      });
    } catch (error) {
      handleUnknownError(error);
      setTimeout(() => {
        this.handleWebsocketOpen();
      }, WEB_SOCKET_RECONNECT_TIMEOUT);
    }
  }

  private handleWebsocketClose() {
    this.isWsConnected = false;
  }

  isConnected(): boolean {
    return this.isWsConnected;
  }

  subscribeForChannel(
    message: IMiddlewareWebSocketSubscriptionMessage,
    callback: (payload: any) => void,
  ) {
    if (this.isWsConnected) {
      Object.keys(WEB_SOCKET_SOURCE).forEach((source) => {
        this.wsClient.send(JSON.stringify({
          ...message,
          source,
        }));
      });
    }

    this.subscribersQueue.push(message);

    const uuid = genUuid();
    this.subscribers[message.payload][uuid] = callback;
    return () => {
      delete this.subscribers[message.payload][uuid];
      if (Object.keys(this.subscribers[message.payload]).length === 0) {
        // should remove the message from the queue if there are no subscribers
        this.subscribersQueue = this.subscribersQueue.filter(
          (msg) => msg.payload !== message.payload,
        );

        // should unsubscribe from the channel if there are no subscribers
        Object.keys(WEB_SOCKET_SOURCE).forEach((source) => {
          this.wsClient.send(JSON.stringify({
            ...message,
            op: WEB_SOCKET_UNSUBSCRIBE,
            source,
          }));
        });
      }
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
      Object.values(this.subscribers[data.subscription as WebSocketChannelName]).forEach(
        (subscriberCb) => subscriberCb(data.payload),
      );
    } catch (error) {
      handleUnknownError(error);
    }
  }

  disconnect() {
    this.subscribersQueue.forEach((message) => {
      Object.keys(WEB_SOCKET_SOURCE).forEach((source) => {
        this.wsClient.send(JSON.stringify({
          ...message,
          source,
          op: WEB_SOCKET_UNSUBSCRIBE,
        }));
      });
    });
    this.wsClient.close();
    this.wsClient.removeEventListener('open', this.handleWebsocketOpen);
    this.wsClient.removeEventListener('close', this.handleWebsocketClose);
    this.wsClient.removeEventListener('message', this.handleWebsocketClose);
  }

  connect(url: string) {
    if (this.wsClient) {
      this.disconnect();
    }

    this.wsClient = new WebSocket(url);
    this.wsClient.addEventListener('open', () => this.handleWebsocketOpen());
    this.wsClient.addEventListener('close', () => this.handleWebsocketClose());
    this.wsClient.addEventListener('message', (message) => this.handleWebsocketMessage(message));
  }

  static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }
}

export default WebSocketClient.getInstance();
