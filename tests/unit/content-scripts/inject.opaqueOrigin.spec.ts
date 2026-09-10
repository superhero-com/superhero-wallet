// @ts-nocheck
/**
 * A frame sandboxed without `allow-same-origin` (`<iframe sandbox="allow-scripts">`,
 * as used by the Twitter/X embed) has an opaque origin that serializes to the
 * literal string `'null'`. `postMessage` rejects that as a target origin, so the
 * content script must not run in such a frame at all.
 */
describe('inject.ts opaque origin frames', () => {
  const stubLocation = (origin: string) => {
    vi.stubGlobal('location', {
      ...window.location,
      origin,
      href: origin === 'null' ? 'https://platform.twitter.com/embed/' : `${origin}/`,
    });
  };

  const loadInject = async (origin: string) => {
    (global as any).browser = {
      runtime: {
        onMessage: { addListener: vi.fn() },
        sendMessage: vi.fn().mockResolvedValue({}),
        connect: vi.fn(() => ({
          onMessage: { addListener: vi.fn() },
          onDisconnect: { addListener: vi.fn() },
          postMessage: vi.fn(),
        })),
      },
    };
    vi.doMock('webextension-polyfill', () => ({ default: (global as any).browser }), { virtual: true });
    vi.doMock('@aeternity/aepp-sdk', async () => ({
      ...(await vi.importActual('@aeternity/aepp-sdk')),
      BrowserRuntimeConnection: vi.fn(),
      BrowserWindowMessageConnection: vi.fn(),
      connectionProxy: vi.fn(),
    }));

    vi.spyOn(window, 'addEventListener');
    // inject.ts polls `document.readyState` via setInterval at module load; a
    // leaked interval would fire after the jsdom environment is torn down.
    vi.spyOn(global, 'setInterval').mockReturnValue(0 as unknown as ReturnType<typeof setInterval>);

    stubLocation(origin);
    vi.resetModules();
    await import('@/content-scripts/inject');
  };

  const getMessageListener = () => (window.addEventListener as vi.Mock).mock.calls
    .find((call) => call[0] === 'message');

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not listen or connect when the frame origin is opaque', async () => {
    await loadInject('null');

    expect(getMessageListener()).toBeUndefined();
    expect((global as any).browser.runtime.onMessage.addListener).not.toHaveBeenCalled();
    expect(global.setInterval).not.toHaveBeenCalled();
  });

  it('runs as usual on a real origin', async () => {
    await loadInject('https://example.com');

    expect(getMessageListener()).toBeDefined();
    expect((global as any).browser.runtime.onMessage.addListener).toHaveBeenCalled();
  });
});
