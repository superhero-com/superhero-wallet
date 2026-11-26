// @ts-nocheck
/**
 * Brave set to use only Brave Wallet makes `window.ethereum` its own for good. A separate file
 * because the property can't be removed afterwards.
 */
describe('inpage.ts on a page whose window.ethereum Brave Wallet locked', () => {
  it('leaves it and still announces itself to EIP-6963 dapps', async () => {
    const braveWallet = { isBraveWallet: true, isMetaMask: true };
    Object.defineProperty(window, 'ethereum', { value: braveWallet });
    const announcements = [];
    window.addEventListener('eip6963:announceProvider', (event) => announcements.push(event.detail));

    vi.resetModules();
    await import('@/content-scripts/inpage');

    expect(window.ethereum).toBe(braveWallet);
    expect(announcements).toEqual([{
      info: expect.objectContaining({ rdns: 'wallet.superhero.com' }),
      provider: window.superheroWallet,
    }]);
    expect(window.superheroWallet.isSuperheroWallet).toBe(true);
  });
});
