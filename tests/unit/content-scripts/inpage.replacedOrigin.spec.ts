// @ts-nocheck
/**
 * `window.origin` is replaceable: a page's top-level `var origin = ...` overwrites it.
 * The provider must keep working on such pages. A separate file because the provider
 * defines non-configurable globals, so only one test per file can inject it.
 */
describe('inpage.ts on a page that replaces window.origin', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('still answers requests', async () => {
    vi.resetModules();
    await import('@/content-scripts/inpage');

    vi.stubGlobal('origin', { x: 0, y: 0 });

    // Stands in for inject.ts, which answers forwarded requests.
    window.addEventListener('message', ({ data }) => {
      if (!data?.superheroWalletRequest) return;
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          superheroWalletApproved: true,
          type: 'result',
          method: data.method,
          result: '0x1',
          requestId: data.requestId,
        },
        origin: window.location.origin,
        source: window,
      }));
    });

    await expect(window.ethereum.request({ method: 'eth_chainId' })).resolves.toBe('0x1');
  });
});
