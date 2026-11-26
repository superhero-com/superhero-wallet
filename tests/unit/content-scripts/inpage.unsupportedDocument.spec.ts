// @ts-nocheck
describe('inpage.ts in a document that is not a web page', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each(['/report.pdf', '/feed.xml'])('injects nothing at %s', async (pathname) => {
    vi.stubGlobal('location', { ...window.location, pathname });
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'dispatchEvent');

    vi.resetModules();
    await import('@/content-scripts/inpage');

    expect(window.ethereum).toBeUndefined();
    expect(window.superheroWallet).toBeUndefined();
    expect(window.addEventListener).not.toHaveBeenCalled();
    expect(window.dispatchEvent).not.toHaveBeenCalled();
  });
});
