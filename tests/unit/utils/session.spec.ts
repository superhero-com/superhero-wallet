// @ts-nocheck
describe('sessionStart', () => {
  const originalBrowser = globalThis.browser;
  let port;
  let constants;

  async function importSessionStart({ isExtension }) {
    vi.doMock('@/constants', async () => ({
      ...(await vi.importActual('@/constants')),
      IS_EXTENSION: isExtension,
      IS_OFFSCREEN_TAB: !isExtension,
    }));
    constants = await import('@/constants');
    return (await import('@/utils/session')).sessionStart;
  }

  function generateExtractableKey() {
    return globalThis.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
  }

  beforeEach(() => {
    vi.resetModules();
    port = { postMessage: vi.fn() };
    globalThis.browser = {
      runtime: { connect: vi.fn(() => port) },
      storage: {
        session: {
          set: vi.fn(() => Promise.resolve()),
          remove: vi.fn(() => Promise.resolve()),
        },
      },
    };
    vi.doMock('@/offscreen/popupHandler', () => ({ getSessionEncryptionKey: vi.fn() }));
  });

  afterEach(() => {
    globalThis.browser = originalBrowser;
  });

  it('opens the session port first and signals the offscreen tab once the key is stored', async () => {
    const sessionStart = await importSessionStart({ isExtension: true });
    let finishWrite;
    globalThis.browser.storage.session.set.mockReturnValue(
      new Promise((resolve) => { finishWrite = resolve; }),
    );

    const starting = sessionStart(await generateExtractableKey());

    expect(globalThis.browser.runtime.connect)
      .toHaveBeenCalledWith({ name: constants.CONNECTION_TYPES.SESSION });
    await vi.waitFor(() => expect(globalThis.browser.storage.session.set).toHaveBeenCalled());
    expect(port.postMessage).not.toHaveBeenCalled();

    finishWrite();
    await starting;

    expect(port.postMessage).toHaveBeenCalledWith({
      method: constants.SESSION_METHODS.sessionKeyStored,
    });
    const [stored] = globalThis.browser.storage.session.set.mock.calls[0];
    expect(stored.exportedEncryptionKey).toBeInstanceOf(Uint8Array);
  });

  it('does not signal the offscreen tab when the key could not be stored', async () => {
    const sessionStart = await importSessionStart({ isExtension: true });
    globalThis.browser.storage.session.set.mockRejectedValue(new Error('Quota exceeded'));

    await expect(sessionStart(await generateExtractableKey())).rejects.toThrow('Quota exceeded');
    expect(port.postMessage).not.toHaveBeenCalled();
  });

  it('does not fail when no offscreen tab is listening on the port', async () => {
    const sessionStart = await importSessionStart({ isExtension: true });
    port.postMessage.mockImplementation(() => {
      throw new Error('Attempting to use a disconnected port object');
    });

    await expect(sessionStart(await generateExtractableKey())).resolves.toBeUndefined();
  });

  it('does nothing in the offscreen tab', async () => {
    const sessionStart = await importSessionStart({ isExtension: false });

    await sessionStart(await generateExtractableKey());

    expect(globalThis.browser.runtime.connect).not.toHaveBeenCalled();
    expect(globalThis.browser.storage.session.set).not.toHaveBeenCalled();
  });
});
