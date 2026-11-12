// @ts-nocheck
/**
 * The EIP-1193 provider a page gets, with the content script replaced by a stand-in wallet.
 * The provider defines globals on the page, so the whole file shares one instance.
 */
describe('inpage.ts provider', () => {
  const ORIGIN = window.location.origin;
  let provider;
  let answer: (method: string, params: unknown) => object;

  const flushMessages = () => new Promise((resolve) => { setTimeout(resolve, 0); });

  function emitWalletEvent(method: string, result: unknown) {
    window.postMessage({
      jsonrpc: '2.0', superheroWalletApproved: true, type: 'result', method, result,
    }, ORIGIN);
    return flushMessages();
  }

  beforeAll(async () => {
    // jsdom's postMessage does not supply the browser's source and origin fields.
    vi.spyOn(window, 'postMessage').mockImplementation((data) => {
      queueMicrotask(() => window.dispatchEvent(new MessageEvent('message', {
        data,
        origin: ORIGIN,
        source: window,
      })));
    });
    // Stands in for the content script
    window.addEventListener('message', ({ data }) => {
      if (!data?.superheroWalletRequest) return;
      window.postMessage({
        jsonrpc: '2.0',
        superheroWalletApproved: true,
        type: 'result',
        method: data.method,
        requestId: data.requestId,
        ...answer(data.method, data.params),
      }, ORIGIN);
    });

    vi.resetModules();
    await import('@/content-scripts/inpage');
    provider = window.ethereum;
  });

  beforeEach(() => {
    answer = (method) => ({ result: `${method}-result` });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('is the Superhero Wallet provider', () => {
    expect(provider.isSuperheroWallet).toBe(true);
    expect(provider.isConnected()).toBe(true);
    expect(window.superheroWallet).toBe(provider);
  });

  it('resolves a request with the result of the wallet', async () => {
    answer = (method, params) => ({ result: { method, params } });

    await expect(provider.request({ method: 'eth_getBalance', params: ['0xabc', 'latest'] }))
      .resolves.toEqual({ method: 'eth_getBalance', params: ['0xabc', 'latest'] });
  });

  it('rejects a request with the error of the wallet', async () => {
    answer = () => ({ error: { code: 4001, message: 'User rejected', data: { reason: 'denied' } } });

    await expect(provider.request({ method: 'personal_sign', params: [] })).rejects.toMatchObject({
      code: 4001,
      message: 'User rejected',
      data: { reason: 'denied' },
    });
  });

  it('answers concurrent requests each with its own result', async () => {
    answer = (method, params) => ({ result: params[0] });

    await expect(Promise.all([1, 2, 3].map((value) => provider.request({
      method: 'eth_call', params: [value],
    })))).resolves.toEqual([1, 2, 3]);
  });

  it('ignores answers from another window or origin', async () => {
    answer = () => ({ result: 'own' });
    const request = provider.request({ method: 'eth_chainId' });
    const { requestId } = window.postMessage.mock.calls.at(-1)[0];
    const forged = {
      superheroWalletApproved: true, type: 'result', method: 'eth_chainId', requestId, result: 'forged',
    };
    window.dispatchEvent(new MessageEvent('message', { data: forged, origin: 'https://evil.example', source: window }));
    window.dispatchEvent(new MessageEvent('message', { data: forged, origin: ORIGIN, source: null }));

    await expect(request).resolves.toBe('own');
  });

  it('settles a request whose answer has an unexpected type', async () => {
    answer = () => ({ result: 1 });

    await expect(provider.request({ method: 'eth_chainId' })).resolves.toBe(1);
    expect(provider.chainId).not.toBe(1);
  });

  it('keeps working after a message of another wallet extension', async () => {
    window.postMessage({ type: 'extensionUIRequest', data: { action: 'loadWalletLinkProvider' } }, ORIGIN);
    await flushMessages();

    expect(window.ethereum).toBe(provider);
    await expect(provider.request({ method: 'eth_blockNumber' })).resolves.toBe('eth_blockNumber-result');
  });

  it('enables by requesting the accounts', async () => {
    answer = (method) => ({ result: method === 'eth_requestAccounts' ? ['0xenabled'] : [] });

    await expect(provider.enable()).resolves.toEqual(['0xenabled']);
  });

  it('keeps the account and the chain of answers for legacy dapps', async () => {
    answer = (method) => ({ result: method === 'eth_chainId' ? '0x38' : ['0xaaa'] });

    await provider.request({ method: 'eth_accounts' });
    await provider.request({ method: 'eth_chainId' });

    expect(provider.selectedAddress).toBe('0xaaa');
    expect(provider.chainId).toBe('0x38');
    expect(provider.networkVersion).toBe('56');
    expect(provider.send('eth_accounts')).toEqual({ jsonrpc: '2.0', id: 1, result: ['0xaaa'] });
    expect(provider.send({ id: 5, method: 'eth_chainId', params: [] }))
      .toEqual({ jsonrpc: '2.0', id: 5, result: '0x38' });
    expect(provider.send('net_version')).toEqual({ jsonrpc: '2.0', id: 1, result: '56' });
  });

  it('gives legacy dapps no account once the wallet takes it away', async () => {
    await emitWalletEvent('accountsChanged', ['0xeee']);
    await emitWalletEvent('accountsChanged', []);

    expect(provider.selectedAddress).toBeNull();
    expect(provider.send('eth_accounts')).toEqual({ jsonrpc: '2.0', id: 1, result: [] });
  });

  it('throws on a synchronous send it cannot answer', () => {
    expect(() => provider.send('eth_sendTransaction')).toThrow(expect.objectContaining({ code: -32602 }));
  });

  it('sends asynchronously with a callback', async () => {
    const callback = vi.fn();

    provider.send({ id: 7, method: 'eth_blockNumber', params: [] }, callback);
    await flushMessages();

    expect(callback).toHaveBeenCalledWith(null, { jsonrpc: '2.0', id: 7, result: 'eth_blockNumber-result' });
  });

  it('calls back the error of the wallet from sendAsync', async () => {
    answer = () => ({ error: { code: 4001, message: 'User rejected', data: { reason: 'denied' } } });
    const callback = vi.fn();

    provider.sendAsync({ id: 8, method: 'personal_sign', params: [] }, callback);
    await flushMessages();

    expect(callback).toHaveBeenCalledWith({
      jsonrpc: '2.0',
      id: 8,
      error: {
        code: 4001,
        message: 'User rejected',
        data: expect.objectContaining({ reason: 'denied' }),
      },
    }, null);
  });

  it('tells listeners when the account changes, once per change', async () => {
    const listener = vi.fn();
    expect(provider.on('accountsChanged', listener)).toBe(provider);

    await emitWalletEvent('accountsChanged', ['0xbbb']);
    await emitWalletEvent('accountsChanged', ['0xbbb']);
    await emitWalletEvent('accountsChanged', ['0xccc', '0xbbb']);

    expect(listener.mock.calls).toEqual([[['0xbbb']], [['0xccc', '0xbbb']]]);
    expect(provider.selectedAddress).toBe('0xccc');

    expect(provider.removeListener('accountsChanged', listener)).toBe(provider);
    await emitWalletEvent('accountsChanged', ['0xddd']);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('tells listeners when the chain changes, once per change', async () => {
    const listener = vi.fn();
    provider.on('chainChanged', listener);

    await emitWalletEvent('chainChanged', '0x89');
    await emitWalletEvent('chainChanged', '0x89');

    expect(listener.mock.calls).toEqual([['0x89']]);
    expect(provider.chainId).toBe('0x89');
    expect(provider.networkVersion).toBe('137');
    provider.removeListener('chainChanged', listener);
  });

  it('announces itself to EIP-6963 dapps that ask', () => {
    const announcements = [];
    const onAnnounce = (event) => announcements.push(event.detail);
    window.addEventListener('eip6963:announceProvider', onAnnounce);

    window.dispatchEvent(new Event('eip6963:requestProvider'));

    window.removeEventListener('eip6963:announceProvider', onAnnounce);
    expect(announcements).toEqual([{
      info: expect.objectContaining({ name: 'Superhero Wallet', rdns: 'wallet.superhero.com' }),
      provider,
    }]);
  });
});
