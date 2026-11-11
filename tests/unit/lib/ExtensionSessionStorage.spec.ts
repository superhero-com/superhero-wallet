// @ts-nocheck
const OLD_KEY = Buffer.alloc(32, 1).toString('base64');
const NEW_KEY = Buffer.alloc(32, 2).toString('base64');

describe('background session mutations', () => {
  const originalBrowser = globalThis.browser;
  let session;
  let stored;
  let mutate;

  beforeEach(async () => {
    vi.resetModules();
    stored = {};
    session = {
      get: vi.fn(async (name) => ({ [name]: stored[name] })),
      set: vi.fn(async (values) => { Object.assign(stored, values); }),
      remove: vi.fn(async (name) => { delete stored[name]; }),
    };
    globalThis.browser = { storage: { session } };
    ({ handleSessionKeyMutation: mutate } = await import('@/lib/ExtensionSessionStorage'));
  });

  afterEach(() => { globalThis.browser = originalBrowser; });

  it('stores a replacement after cleanup whose comparison read was still pending', async () => {
    await mutate({ operation: 'set', key: OLD_KEY });
    let releaseRead;
    session.get.mockImplementationOnce((name) => {
      const captured = stored[name];
      return new Promise((resolve) => {
        releaseRead = () => resolve({ [name]: captured });
      });
    });
    const cleanup = mutate({ operation: 'clearIfMatching', key: OLD_KEY });
    await vi.waitFor(() => expect(releaseRead).toBeDefined());
    const replacement = mutate({ operation: 'set', key: NEW_KEY });

    releaseRead();
    await expect(cleanup).resolves.toEqual({ ok: true });
    await expect(replacement).resolves.toEqual({ ok: true });
    expect(Buffer.from(stored.exportedEncryptionKey).toString('base64')).toBe(NEW_KEY);
  });

  it('preserves a replacement that was stored before conditional cleanup', async () => {
    await mutate({ operation: 'set', key: NEW_KEY });
    await expect(mutate({ operation: 'clearIfMatching', key: OLD_KEY }))
      .resolves.toEqual({ ok: true });
    expect(Buffer.from(stored.exportedEncryptionKey).toString('base64')).toBe(NEW_KEY);
    expect(session.remove).not.toHaveBeenCalled();
  });

  it('removes the matching stale key and leaves an absent key absent', async () => {
    await mutate({ operation: 'set', key: OLD_KEY });
    await mutate({ operation: 'clearIfMatching', key: OLD_KEY });
    await mutate({ operation: 'clearIfMatching', key: OLD_KEY });
    expect(stored).toEqual({});
    expect(session.remove).toHaveBeenCalledTimes(1);
  });

  it('reports storage failure and still accepts a later login and explicit logout', async () => {
    session.set.mockRejectedValueOnce(new Error('Storage unavailable'));
    await expect(mutate({ operation: 'set', key: OLD_KEY }))
      .resolves.toEqual({ ok: false, error: 'Storage unavailable' });
    await expect(mutate({ operation: 'set', key: NEW_KEY })).resolves.toEqual({ ok: true });
    expect(Buffer.from(stored.exportedEncryptionKey).toString('base64')).toBe(NEW_KEY);
    await expect(mutate({ operation: 'clear' })).resolves.toEqual({ ok: true });
    expect(stored).toEqual({});
  });

  it.each([
    undefined,
    { operation: 'unknown' },
    { operation: 'set', key: 'not a key' },
    { operation: 'clearIfMatching', key: Buffer.alloc(16).toString('base64') },
  ])('rejects malformed mutation messages without writing: %j', async (payload) => {
    expect(await mutate(payload)).toEqual({ ok: false, error: expect.any(String) });
    expect(session.set).not.toHaveBeenCalled();
    expect(session.remove).not.toHaveBeenCalled();
  });
});
