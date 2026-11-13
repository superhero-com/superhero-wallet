/* eslint-disable global-require */
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

describe('the inpage provider through the content-script transport', () => {
  const sendMessage = vi.fn();
  const flushMessages = () => new Promise((resolve) => { setTimeout(resolve, 0); });
  let provider: NonNullable<Window['ethereum']>;

  beforeAll(async () => {
    vi.resetModules();
    vi.doMock('webextension-polyfill', () => ({
      default: {
        runtime: {
          sendMessage,
          onMessage: { addListener: vi.fn() },
        },
      },
    }));
    // The aepp relay is independent of the EVM message transport.
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
    // jsdom's postMessage does not supply the browser's source and origin fields.
    vi.spyOn(window, 'postMessage').mockImplementation((data) => {
      queueMicrotask(() => window.dispatchEvent(new MessageEvent('message', {
        data,
        origin: window.location.origin,
        source: window,
      })));
    });

    await import('@/content-scripts/inject');
    // Load once: the provider defines non-configurable globals on the page.
    await import('@/content-scripts/inpage');
    provider = window.ethereum!;
  });

  beforeEach(() => {
    sendMessage.mockReset();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('settles repeated transport failures and handles a successful retry', async () => {
    sendMessage.mockRejectedValue(new Error('Receiving end does not exist'));
    const outcomes = await Promise.all(Array.from({ length: 20 }, () => (
      provider.request({ method: 'eth_chainId' }).then(
        () => ({ resolved: true }),
        (error: unknown) => ({ error }),
      )
    )));

    expect(outcomes).toEqual(Array.from({ length: 20 }, () => ({
      error: expect.objectContaining({ code: -32603, message: expect.any(String) }),
    })));
    expect(sendMessage).toHaveBeenCalledTimes(20);

    sendMessage.mockResolvedValueOnce({ result: '0x1' });
    await expect(provider.request({ method: 'eth_chainId' })).resolves.toBe('0x1');
  });

  it('rejects when the extension context throws synchronously', async () => {
    sendMessage.mockImplementationOnce(() => { throw new Error('Extension context invalidated'); });

    await expect(provider.request({ method: 'eth_chainId' })).rejects.toMatchObject({
      code: -32603,
      message: expect.any(String),
    });
  });

  it.each([undefined, null])('rejects an absent wallet response (%s)', async (response) => {
    sendMessage.mockResolvedValueOnce(response);

    await expect(provider.request({ method: 'eth_chainId' })).rejects.toMatchObject({
      code: -32603,
      message: expect.any(String),
    });
  });

  it('preserves successful null results and wallet RPC errors', async () => {
    sendMessage.mockResolvedValueOnce({ result: null });
    await expect(provider.request({ method: 'eth_getTransactionByHash', params: ['0x123'] }))
      .resolves.toBeNull();

    const error = { code: 4001, message: 'The user rejected the request', data: { reason: 'denied' } };
    sendMessage.mockResolvedValueOnce({ error });
    await expect(provider.request({ method: 'personal_sign', params: ['0x123', '0xabc'] }))
      .rejects.toMatchObject(error);
  });

  it('keeps an approval pending until the wallet answers', async () => {
    let answer: (value: { result: string }) => void;
    sendMessage.mockReturnValueOnce(new Promise((resolve) => { answer = resolve; }));
    const settled = vi.fn();
    const request = provider.request({ method: 'personal_sign', params: ['0x123', '0xabc'] });
    request.then(settled, settled);

    await flushMessages();
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(settled).not.toHaveBeenCalled();

    answer!({ result: '0xsigned' });
    await expect(request).resolves.toBe('0xsigned');
    expect(settled).toHaveBeenCalledTimes(1);
  });
});
