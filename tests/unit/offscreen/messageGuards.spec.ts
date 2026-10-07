// @ts-nocheck
describe('offscreen message guards', () => {
  beforeEach(async () => {
    (global as any).browser = {
      runtime: {
        id: 'test-extension-id',
        getURL: (path) => `chrome-extension://test-extension-id/${path}`,
      },
    };
    vi.resetModules();
  });

  it('accepts only offscreen-targeted messages from this extension', async () => {
    // eslint-disable-next-line global-require
    const { isAcceptedOffscreenSender } = (await import('@/offscreen/messageGuards'));

    expect(isAcceptedOffscreenSender(
      { target: 'offscreen', method: 'eth_sendTransaction' },
      { id: 'test-extension-id' },
    )).toBe(true);
  });

  it.each([
    ['other extension', { target: 'offscreen' }, { id: 'other-extension-id' }],
    ['missing sender', { target: 'offscreen' }, undefined],
    ['sender without id', { target: 'offscreen' }, {}],
    ['wrong target', { target: 'background' }, { id: 'test-extension-id' }],
    ['missing message', undefined, { id: 'test-extension-id' }],
  ])('rejects %s', async (_label, msg, sender) => {
    // eslint-disable-next-line global-require
    const { isAcceptedOffscreenSender } = (await import('@/offscreen/messageGuards'));

    expect(isAcceptedOffscreenSender(msg, sender)).toBe(false);
  });

  describe('isExtensionPageSender', () => {
    it.each([
      'chrome-extension://test-extension-id/index.html',
      'chrome-extension://test-extension-id/index.html?id=1#/popup-sign-tx',
    ])('accepts the wallet page %s', async (url) => {
      const { isExtensionPageSender } = (await import('@/offscreen/messageGuards'));

      expect(isExtensionPageSender({ id: 'test-extension-id', url })).toBe(true);
    });

    it('accepts Firefox wallet pages, whose URL has a UUID instead of the id', async () => {
      browser.runtime.getURL = (path) => `moz-extension://4f8b-uuid/${path}`;
      const { isExtensionPageSender } = (await import('@/offscreen/messageGuards'));

      expect(isExtensionPageSender({ url: 'moz-extension://4f8b-uuid/index.html' })).toBe(true);
      expect(isExtensionPageSender({ url: 'moz-extension://test-extension-id/index.html' })).toBe(false);
    });

    it.each([
      ['a content script on a web page', { id: 'test-extension-id', url: 'https://aepp.example/', tab: { id: 1 } }],
      ['a look-alike extension id', { url: 'chrome-extension://test-extension-id-evil/index.html' }],
      ['a web page URL containing the extension URL', { url: 'https://evil.example/?chrome-extension://test-extension-id/' }],
      ['a sender without URL', { id: 'test-extension-id' }],
      ['a missing sender', undefined],
    ])('rejects %s', async (_label, sender) => {
      const { isExtensionPageSender } = (await import('@/offscreen/messageGuards'));

      expect(isExtensionPageSender(sender)).toBe(false);
    });
  });
});
