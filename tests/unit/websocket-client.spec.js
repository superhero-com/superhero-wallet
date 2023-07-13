import WebSocketClient from '../../src/lib/WebSocketClient';
import {
  NETWORK_TESTNET,
  WEB_SOCKET_SOURCE,
  WEB_SOCKET_CHANNELS,
} from '../../src/popup/utils';

const testAddress = 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5';

const WEB_SOCKET_SOURCE_COUNT = Object.keys(WEB_SOCKET_SOURCE).length;

describe('WebSocketClient', () => {
  beforeAll(async () => {
    WebSocketClient.connect(NETWORK_TESTNET.websocketUrl);
    await new Promise((resolve) => {
      WebSocketClient.wsClient.onopen = () => {
        resolve();
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Can connect to ', () => {
    it('should connect and set isWsConnected to true', () => {
      expect(WebSocketClient.isWsConnected).toBe(true);
    });
  });

  describe('Can handle transactions subscription', () => {
    let transactionChannelUnsubscribe;
    it('should subscribe for transactions', () => {
      const mockSend = jest.spyOn(WebSocketClient.wsClient, 'send');
      transactionChannelUnsubscribe = WebSocketClient.subscribeForTransactionsUpdates(
        jest.fn(),
      );
      expect(mockSend).toHaveBeenCalledTimes(WEB_SOCKET_SOURCE_COUNT);
      expect(Object.keys(WebSocketClient.subscribers[WEB_SOCKET_CHANNELS.Transactions]))
        .toHaveLength(1);
      expect(WebSocketClient.subscribersQueue)
        .toHaveLength(1);
    });

    it('should unsubscribe from transactions', () => {
      const mockSend = jest.spyOn(WebSocketClient.wsClient, 'send');
      transactionChannelUnsubscribe();
      expect(mockSend).toHaveBeenCalledTimes(WEB_SOCKET_SOURCE_COUNT);
      expect(Object.keys(WebSocketClient.subscribers[WEB_SOCKET_CHANNELS.Transactions]))
        .toHaveLength(0);
      expect(WebSocketClient.subscribersQueue)
        .toHaveLength(0);
    });
  });

  describe('Can handle micro blocks subscription', () => {
    let microBlocksChannelUnsubscribe;
    it('should subscribe for micro blocks', () => {
      const mockSend = jest.spyOn(WebSocketClient.wsClient, 'send');
      microBlocksChannelUnsubscribe = WebSocketClient.subscribeForMicroBlocksUpdates(
        jest.fn(),
      );
      expect(mockSend).toHaveBeenCalledTimes(WEB_SOCKET_SOURCE_COUNT);
      expect(Object.keys(WebSocketClient.subscribers[WEB_SOCKET_CHANNELS.MicroBlocks]))
        .toHaveLength(1);
      expect(WebSocketClient.subscribersQueue)
        .toHaveLength(1);
    });

    it('should unsubscribe from micro blocks', () => {
      const mockSend = jest.spyOn(WebSocketClient.wsClient, 'send');
      microBlocksChannelUnsubscribe();
      expect(mockSend).toHaveBeenCalledTimes(WEB_SOCKET_SOURCE_COUNT);
      expect(Object.keys(WebSocketClient.subscribers[WEB_SOCKET_CHANNELS.MicroBlocks]))
        .toHaveLength(0);
      expect(WebSocketClient.subscribersQueue)
        .toHaveLength(0);
    });
  });

  describe('Can handle account transactions subscription', () => {
    let transactionChannelUnsubscribe;
    it('should subscribe for account transactions', () => {
      const mockSend = jest.spyOn(WebSocketClient.wsClient, 'send');
      transactionChannelUnsubscribe = WebSocketClient.subscribeForAccountUpdates(
        testAddress, jest.fn(),
      );
      expect(mockSend).toHaveBeenCalledTimes(WEB_SOCKET_SOURCE_COUNT);
      expect(Object.keys(WebSocketClient.subscribers[WEB_SOCKET_CHANNELS.Object]))
        .toHaveLength(1);
      expect(WebSocketClient.subscribersQueue)
        .toHaveLength(1);
    });

    it('should unsubscribe from account transactions', () => {
      const mockSend = jest.spyOn(WebSocketClient.wsClient, 'send');
      transactionChannelUnsubscribe();
      expect(mockSend).toHaveBeenCalledTimes(WEB_SOCKET_SOURCE_COUNT);
      expect(Object.keys(WebSocketClient.subscribers[WEB_SOCKET_CHANNELS.Object]))
        .toHaveLength(0);
      expect(WebSocketClient.subscribersQueue)
        .toHaveLength(0);
    });
  });
});
