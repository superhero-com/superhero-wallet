// @ts-nocheck
describe('broadcastSignedTransaction', () => {
  const sendSignedTransactionMock = jest.fn();

  function createPromiEvent() {
    const handlers: Record<string, Function> = {};
    return {
      on: jest.fn((event: string, handler: Function) => {
        handlers[event] = handler;
        return this;
      }),
      catch: jest.fn(),
      emit: (event: string, payload?: unknown) => handlers[event]?.(payload),
    };
  }

  const loadModule = () => {
    jest.resetModules();
    sendSignedTransactionMock.mockReset();
    jest.doMock('web3-eth', () => ({
      __esModule: true,
      default: jest.fn(),
      sendSignedTransaction: sendSignedTransactionMock,
    }));
    jest.doMock('web3-types', () => ({
      DEFAULT_RETURN_FORMAT: {},
    }));

    // eslint-disable-next-line global-require
    return require('@/protocols/evm/libs/broadcastSignedTransaction');
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves when the provider emits transactionHash', async () => {
    const promiEvent = createPromiEvent();
    const { broadcastSignedTransaction } = loadModule();
    sendSignedTransactionMock.mockReturnValue(promiEvent);

    const promise = broadcastSignedTransaction({ provider: true }, '0xsigned');
    promiEvent.emit('transactionHash', '0xhash');

    await expect(promise).resolves.toBeUndefined();
  });

  it('rejects when the provider emits error', async () => {
    const promiEvent = createPromiEvent();
    const error = new Error('insufficient funds');
    const { broadcastSignedTransaction } = loadModule();
    sendSignedTransactionMock.mockReturnValue(promiEvent);

    const promise = broadcastSignedTransaction({ provider: true }, '0xsigned');
    promiEvent.emit('error', error);

    await expect(promise).rejects.toThrow('insufficient funds');
  });

  it('rejects when no transactionHash is emitted before the timeout', async () => {
    jest.useFakeTimers();
    const promiEvent = createPromiEvent();
    const { broadcastSignedTransaction } = loadModule();
    sendSignedTransactionMock.mockReturnValue(promiEvent);

    const promise = broadcastSignedTransaction({ provider: true }, '0xsigned');
    jest.advanceTimersByTime(45_000);

    await expect(promise).rejects.toThrow('timed out after 45000ms');
  });

  it('settles only once when multiple provider events fire', async () => {
    const promiEvent = createPromiEvent();
    const { broadcastSignedTransaction } = loadModule();
    sendSignedTransactionMock.mockReturnValue(promiEvent);

    const promise = broadcastSignedTransaction({ provider: true }, '0xsigned');
    promiEvent.emit('transactionHash', '0xhash');
    promiEvent.emit('error', new Error('late error'));

    await expect(promise).resolves.toBeUndefined();
  });
});
