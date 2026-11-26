// @ts-nocheck
import { installSessionMutationHandler } from '../helpers/extensionSession';

describe('extension session', () => {
  const originalBrowser = globalThis.browser;
  let port;
  let constants;
  let stored;

  async function importSessionStart({ isExtension, isFirefox = false }) {
    vi.doMock('@/constants', async () => ({
      ...(await vi.importActual('@/constants')),
      IS_EXTENSION: isExtension,
      IS_OFFSCREEN_TAB: !isExtension,
      IS_FIREFOX: isFirefox,
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
    port = { postMessage: vi.fn(), disconnect: vi.fn() };
    stored = {};
    globalThis.browser = {
      runtime: { connect: vi.fn(() => port), sendMessage: vi.fn() },
      storage: {
        session: {
          get: vi.fn(async (key) => ({ [key]: stored[key] })),
          set: vi.fn(async (values) => { Object.assign(stored, values); }),
          remove: vi.fn(async (key) => { delete stored[key]; }),
        },
      },
    };
    installSessionMutationHandler();
    vi.doMock('@/offscreen/popupHandler', () => ({ getSessionEncryptionKey: vi.fn() }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    const [written] = globalThis.browser.storage.session.set.mock.calls[0];
    expect(written.exportedEncryptionKey).toBeInstanceOf(Uint8Array);
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

  it('lets the background time the session out once the page locks', async () => {
    const sessionStart = await importSessionStart({ isExtension: true });
    const { sessionEnd } = await import('@/utils/session');
    const ports = [];
    globalThis.browser.runtime.connect.mockImplementation(() => {
      const newPort = { postMessage: vi.fn(), disconnect: vi.fn() };
      ports.push(newPort);
      return newPort;
    });
    await sessionStart(await generateExtractableKey());
    await sessionStart(await generateExtractableKey()); // E.g. after a password change

    await sessionEnd();

    expect(globalThis.browser.storage.session.remove).toHaveBeenCalledWith('exportedEncryptionKey');
    expect(ports).toHaveLength(2);
    ports.forEach(({ disconnect }) => expect(disconnect).toHaveBeenCalledTimes(1));

    // Not again when the page locks once more
    await sessionEnd();
    ports.forEach(({ disconnect }) => expect(disconnect).toHaveBeenCalledTimes(1));
  });

  it('lets the background time the session out also when the key could not be removed', async () => {
    const sessionStart = await importSessionStart({ isExtension: true });
    const { sessionEnd } = await import('@/utils/session');
    await sessionStart(await generateExtractableKey());
    globalThis.browser.storage.session.remove.mockRejectedValue(new Error('Extension context invalidated'));

    await expect(sessionEnd()).rejects.toThrow('Extension context invalidated');
    expect(port.disconnect).toHaveBeenCalledTimes(1);
  });

  it('keeps the session of a page shown again with one port, until it is released', async () => {
    await importSessionStart({ isExtension: true });
    const { sessionHold, sessionRelease } = await import('@/utils/session');

    sessionHold();
    sessionHold();
    expect(globalThis.browser.runtime.connect).toHaveBeenCalledTimes(1);
    expect(globalThis.browser.runtime.connect)
      .toHaveBeenCalledWith({ name: constants.CONNECTION_TYPES.SESSION });

    await sessionRelease();
    expect(port.disconnect).toHaveBeenCalledTimes(1);
    expect(globalThis.browser.storage.session.remove).not.toHaveBeenCalled();

    sessionHold();
    expect(globalThis.browser.runtime.connect).toHaveBeenCalledTimes(2);
  });

  it('does not open another port for a page that keeps the session already', async () => {
    const sessionStart = await importSessionStart({ isExtension: true });
    const { sessionHold } = await import('@/utils/session');

    await sessionStart(await generateExtractableKey());
    sessionHold();

    expect(globalThis.browser.runtime.connect).toHaveBeenCalledTimes(1);
  });

  it('releases the port only once the offscreen tab was told about the stored key', async () => {
    const sessionStart = await importSessionStart({ isExtension: true });
    const { sessionRelease } = await import('@/utils/session');
    let finishWrite;
    globalThis.browser.storage.session.set.mockReturnValue(
      new Promise((resolve) => { finishWrite = resolve; }),
    );
    const starting = sessionStart(await generateExtractableKey());
    await vi.waitFor(() => expect(globalThis.browser.storage.session.set).toHaveBeenCalled());

    const releasing = sessionRelease();
    await Promise.resolve();
    expect(port.disconnect).not.toHaveBeenCalled();

    finishWrite();
    await Promise.all([starting, releasing]);
    expect(port.postMessage.mock.invocationCallOrder[0])
      .toBeLessThan(port.disconnect.mock.invocationCallOrder[0]);
  });

  it('does nothing in the offscreen tab', async () => {
    const sessionStart = await importSessionStart({ isExtension: false });
    const { sessionHold } = await import('@/utils/session');

    await sessionStart(await generateExtractableKey());
    sessionHold();

    expect(globalThis.browser.runtime.connect).not.toHaveBeenCalled();
    expect(globalThis.browser.storage.session.set).not.toHaveBeenCalled();
  });

  it.each([false, true])('routes plain key data to the background owner (Firefox: %s)', async (isFirefox) => {
    const sessionStart = await importSessionStart({ isExtension: true, isFirefox });
    const key = await generateExtractableKey();
    await sessionStart(key);

    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledWith({
      target: isFirefox ? 'offscreen' : 'background',
      method: constants.SESSION_METHODS.mutateSessionKey,
      payload: {
        operation: 'set',
        key: Buffer.from(await crypto.subtle.exportKey('raw', key)).toString('base64'),
      },
    });
  });

  it('orders a logout after a start whose key export has not finished', async () => {
    const sessionStart = await importSessionStart({ isExtension: true });
    const { sessionEnd } = await import('@/utils/session');
    const key = await generateExtractableKey();
    const exportKey = crypto.subtle.exportKey.bind(crypto.subtle);
    let releaseExport;
    vi.spyOn(crypto.subtle, 'exportKey').mockImplementationOnce((...args) => (
      new Promise((resolve) => {
        releaseExport = async () => resolve(await exportKey(...args));
      })
    ));
    const starting = sessionStart(key);
    const ending = sessionEnd();
    await vi.waitFor(() => expect(releaseExport).toBeDefined());
    expect(globalThis.browser.storage.session.remove).not.toHaveBeenCalled();

    await releaseExport();
    await Promise.all([starting, ending]);
    expect(stored).toEqual({});
    expect(port.disconnect).toHaveBeenCalledTimes(1);
  });

  it('keeps a later login and its port when a previous logout settles', async () => {
    const sessionStart = await importSessionStart({ isExtension: true });
    const { sessionEnd } = await import('@/utils/session');
    const ports = [];
    globalThis.browser.runtime.connect.mockImplementation(() => {
      const next = { postMessage: vi.fn(), disconnect: vi.fn() };
      ports.push(next);
      return next;
    });
    await sessionStart(await generateExtractableKey());
    let releaseRemoval;
    globalThis.browser.storage.session.remove.mockImplementationOnce((name) => (
      new Promise((resolve) => {
        releaseRemoval = () => { delete stored[name]; resolve(); };
      })
    ));
    const ending = sessionEnd();
    await vi.waitFor(() => expect(releaseRemoval).toBeDefined());
    const key = await generateExtractableKey();
    const starting = sessionStart(key);

    releaseRemoval();
    await Promise.all([ending, starting]);
    expect(Buffer.from(stored.exportedEncryptionKey)).toEqual(
      Buffer.from(await crypto.subtle.exportKey('raw', key)),
    );
    expect(ports[0].disconnect).toHaveBeenCalledTimes(1);
    expect(ports[1].disconnect).not.toHaveBeenCalled();
  });

  it('does not poison later mutations when the background rejects one', async () => {
    const sessionStart = await importSessionStart({ isExtension: true });
    globalThis.browser.runtime.sendMessage.mockResolvedValueOnce({ ok: false, error: 'Storage unavailable' });
    await expect(sessionStart(await generateExtractableKey())).rejects.toThrow('Storage unavailable');
    const key = await generateExtractableKey();
    await sessionStart(key);
    expect(Buffer.from(stored.exportedEncryptionKey)).toEqual(
      Buffer.from(await crypto.subtle.exportKey('raw', key)),
    );
  });
});
