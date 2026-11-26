// @ts-nocheck
/** Another wallet set `window.ethereum` before the provider loaded */
describe('inpage.ts on a page where another wallet set window.ethereum', () => {
  async function loadInpage(otherWallet) {
    window.ethereum = otherWallet;
    vi.resetModules();
    await import('@/content-scripts/inpage');
  }

  afterEach(() => {
    delete window.ethereum;
  });

  it('leaves it to that wallet', async () => {
    const otherWallet = { isMetaMask: true };

    await loadInpage(otherWallet);

    expect(window.ethereum).toBe(otherWallet);
  });

  it('takes it from Brave Wallet, which Brave leaves to extensions by default', async () => {
    await loadInpage({ isBraveWallet: true, isMetaMask: true });

    expect(window.ethereum.isSuperheroWallet).toBe(true);
  });
});
