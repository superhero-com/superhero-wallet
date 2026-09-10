// @ts-nocheck
/**
 * Unit tests for HIGH-09 — the callback-URL validation layer in
 * `useDeepLinkApi.openCallbackOrGoHome`.
 *
 * The security logic itself (`validateCallbackUrl` / `isTrustedCallbackUrl` from
 * `@/utils`) runs REAL here, together with the real `@/constants`, the real
 * `@/popup/router/routeNames` and the real i18n. An earlier version of this file
 * mocked `@/utils` and re-implemented those two functions inline, which meant the
 * shipping security code was never actually exercised — the tests validated the
 * test's own copy and would have stayed green through a regression in the real one.
 * (That copy had also drifted: it rejected the `superhero:` / `wc:` app schemes that
 * the real implementation explicitly trusts.)
 *
 * Only genuine external boundaries are stubbed:
 *   - `vue-router`'s `useRoute` — the deeplink query IS the test input.
 *   - `@ionic/vue`'s `useIonRouter` — needs an `IonPage` context. Partially mocked
 *     (via `importOriginal`) so that `isPlatform`, which the real `@/constants`
 *     imports from the same module, keeps working.
 *   - `@/composables/modals` — the real one mounts modal components.
 *   - `@/lib/logger` — telemetry side-effect, and the assertion target.
 *   - `window.open` — actual browser navigation.
 */
describe('useDeepLinkApi.openCallbackOrGoHome — security gating (HIGH-09)', () => {
  const routerReplace = vi.fn();
  const loggerWrite = vi.fn();
  const windowOpen = vi.fn();
  const openConfirmModalMock = vi.fn();
  let confirmModalImpl: () => Promise<void>;
  let route: { query: Record<string, string> };

  const setup = () => {
    vi.resetModules();
    routerReplace.mockClear();
    loggerWrite.mockClear();
    windowOpen.mockClear();
    openConfirmModalMock.mockClear();

    vi.doMock('vue-router', async (importOriginal) => ({
      ...(await importOriginal()),
      useRoute: () => route,
    }));
    vi.doMock('@ionic/vue', async (importOriginal) => ({
      ...(await importOriginal()),
      useIonRouter: () => ({ replace: routerReplace }),
    }));
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openModal: vi.fn(),
        openConfirmModal: openConfirmModalMock,
      }),
    }));
    vi.doMock('@/lib/logger', () => ({
      __esModule: true,
      default: { write: loggerWrite },
    }));

    window.open = windowOpen;
  };

  const loadApi = async () => {
    const { useDeepLinkApi } = await import('@/composables/deepLinkApi');
    return useDeepLinkApi();
  };

  beforeEach(() => {
    confirmModalImpl = () => Promise.resolve();
    openConfirmModalMock.mockImplementation(() => confirmModalImpl());
    route = { query: {} };
    setup();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rejected callbacks', () => {
    it('rejects a javascript: callback without redirecting, and surfaces a modal error', async () => {
      // eslint-disable-next-line no-script-url
      route = { query: { 'x-success': encodeURIComponent('javascript:alert(1)') } };
      setup();

      await (await loadApi()).openCallbackOrGoHome(true);

      expect(loggerWrite).toHaveBeenCalledTimes(1);
      const [writeArgs] = loggerWrite.mock.calls[0];
      // The i18n keys must actually resolve (real i18n -> not the raw key back).
      expect(writeArgs.title).not.toBe('pages.deepLink.invalidCallbackTitle');
      expect(writeArgs.title).toBeTruthy();
      // The user must be shown which destination was refused.
      // eslint-disable-next-line no-script-url
      expect(writeArgs.message).toContain('javascript:alert(1)');
      expect(writeArgs.type).toBe('api-response');
      expect(writeArgs.modal).toBe(true);

      // Router goes home, but `window.open` must NEVER run for a dangerous scheme.
      expect(routerReplace).toHaveBeenCalledWith({ name: 'account' });
      expect(windowOpen).not.toHaveBeenCalled();
    });

    it.each([
      ['data: payload', 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='],
      ['file: path', 'file:///etc/passwd'],
      ['vbscript: payload', 'vbscript:msgbox'],
      ['blob: URL', 'blob:https://example.com/abc'],
      ['chrome-extension: URL', 'chrome-extension://abc/popup.html'],
      ['unregistered app scheme', 'myapp://callback?signature={signature}'],
      ['intent scheme', 'intent://wallet/callback#Intent;scheme=myapp;end'],
      ['mailto scheme', 'mailto:test@example.com?body={signature}'],
    ])('rejects %s without redirecting', async (_label, rawUrl) => {
      route = { query: { 'x-success': encodeURIComponent(rawUrl) } };
      setup();

      await (await loadApi()).openCallbackOrGoHome(true);

      expect(loggerWrite).toHaveBeenCalledTimes(1);
      expect(windowOpen).not.toHaveBeenCalled();
    });

    it('rejects malformed callback URLs', async () => {
      route = { query: { 'x-success': encodeURIComponent('not a url at all') } };
      setup();

      await (await loadApi()).openCallbackOrGoHome(true);

      expect(loggerWrite).toHaveBeenCalledTimes(1);
      expect(windowOpen).not.toHaveBeenCalled();
    });

    it('routes home without throwing when x-success has malformed percent-encoding', async () => {
      route = { query: { 'x-success': '%ZZ' } };
      setup();

      // Must RESOLVE, not reject: every caller invokes this fire-and-forget, so a
      // URIError from `decodeURIComponent` would become an unhandled rejection.
      await expect((await loadApi()).openCallbackOrGoHome(true)).resolves.toBeUndefined();

      expect(routerReplace).toHaveBeenCalledWith({ name: 'account' });
      expect(windowOpen).not.toHaveBeenCalled();
    });

    it('redirects home without logging or opening when no x-success query is present', async () => {
      route = { query: {} };
      setup();

      await (await loadApi()).openCallbackOrGoHome(true);

      expect(loggerWrite).not.toHaveBeenCalled();
      expect(routerReplace).toHaveBeenCalledWith({ name: 'account' });
      expect(windowOpen).not.toHaveBeenCalled();
    });

    it('awaits the invalid-callback logger modal before redirecting home', async () => {
      // eslint-disable-next-line no-script-url
      route = { query: { 'x-success': encodeURIComponent('javascript:alert(1)') } };
      setup();

      let resolveLogger: () => void;
      loggerWrite.mockImplementationOnce(
        () => new Promise((resolve) => { resolveLogger = resolve; }),
      );

      const openPromise = (await loadApi()).openCallbackOrGoHome(true);

      await Promise.resolve();
      expect(routerReplace).not.toHaveBeenCalled();

      resolveLogger!();
      await openPromise;
      expect(routerReplace).toHaveBeenCalledWith({ name: 'account' });
    });
  });

  describe('trusted destinations (no confirmation prompt)', () => {
    it.each([
      'https://superhero.com/callback?a=1',
      'https://chat.superhero.com/callback',
      'https://wallet.superhero.com/success',
      'https://deep.nested.superhero.com/a/b',
    ])('redirects to trusted aggregator origin %s without prompting', async (trustedUrl) => {
      vi.useFakeTimers();
      route = { query: { 'x-success': encodeURIComponent(trustedUrl) } };
      setup();
      confirmModalImpl = () => {
        throw new Error('openConfirmModal must not be called for a trusted origin');
      };

      await (await loadApi()).openCallbackOrGoHome(true);
      vi.runAllTimers();

      expect(loggerWrite).not.toHaveBeenCalled();
      expect(openConfirmModalMock).not.toHaveBeenCalled();
      expect(routerReplace).toHaveBeenCalledWith({ name: 'account' });
      expect(windowOpen).toHaveBeenCalledWith(trustedUrl, '_self');
    });

    /**
     * `superhero:` and `wc:` are this app's registered native schemes (see
     * ALLOWED_NATIVE_CALLBACK_PROTOCOLS in `src/utils/callbackUrl.ts`). The real
     * implementation both ACCEPTS and TRUSTS them, so returning to a native dApp
     * must not be gated behind a confirmation prompt.
     */
    it('trusts the registered superhero: app scheme and substitutes template params', async () => {
      vi.useFakeTimers();
      route = {
        query: { 'x-success': encodeURIComponent('superhero://wallet/callback?tx={transaction}') },
      };
      setup();
      confirmModalImpl = () => {
        throw new Error('openConfirmModal must not be called for a registered app scheme');
      };

      await (await loadApi()).openCallbackOrGoHome(true, { transaction: 'tx_abc123' });
      vi.runAllTimers();

      expect(loggerWrite).not.toHaveBeenCalled();
      expect(openConfirmModalMock).not.toHaveBeenCalled();
      expect(windowOpen).toHaveBeenCalledTimes(1);
      const [forwardedUrl] = windowOpen.mock.calls[0];
      expect(forwardedUrl).toContain('superhero://wallet/callback');
      expect(forwardedUrl).toContain('tx_abc123');
    });

    it('trusts the registered wc: (WalletConnect) scheme', async () => {
      vi.useFakeTimers();
      const wcUrl = 'wc:7f6e12@2?relay-protocol=irn&symKey=abc';
      route = { query: { 'x-success': encodeURIComponent(wcUrl) } };
      setup();
      confirmModalImpl = () => {
        throw new Error('openConfirmModal must not be called for a registered app scheme');
      };

      await (await loadApi()).openCallbackOrGoHome(true);
      vi.runAllTimers();

      expect(loggerWrite).not.toHaveBeenCalled();
      expect(openConfirmModalMock).not.toHaveBeenCalled();
      expect(windowOpen).toHaveBeenCalledTimes(1);
      expect(windowOpen.mock.calls[0][0]).toContain('wc:7f6e12');
    });
  });

  describe('untrusted destinations (confirmation required)', () => {
    it('requires user confirmation before forwarding signed data to a foreign origin', async () => {
      vi.useFakeTimers();
      let resolveModal: (v?: unknown) => void;
      confirmModalImpl = () => new Promise((resolve) => { resolveModal = resolve; });

      route = {
        query: { 'x-success': encodeURIComponent('https://attacker.example/?s={signature}') },
      };
      setup();

      const openPromise = (await loadApi()).openCallbackOrGoHome(true, { signature: 'SIG123' });

      // While the confirm modal is pending, nothing may be opened.
      await Promise.resolve();
      expect(windowOpen).not.toHaveBeenCalled();
      expect(openConfirmModalMock).toHaveBeenCalledTimes(1);

      // The prompt must name the destination the signed data would go to.
      const [confirmArgs] = openConfirmModalMock.mock.calls[0];
      expect(confirmArgs.title).not.toBe('pages.deepLink.externalCallbackTitle');
      expect(confirmArgs.title).toBeTruthy();
      expect(confirmArgs.msg).toContain('https://attacker.example/?s=SIG123');

      resolveModal!();
      await openPromise;
      vi.runAllTimers();

      // `{signature}` must be substituted into the URL that reaches `window.open`.
      expect(windowOpen).toHaveBeenCalledTimes(1);
      expect(windowOpen.mock.calls[0][0]).toContain('https://attacker.example/?s=SIG123');
    });

    it('cancels the redirect when the user rejects the external-site confirmation', async () => {
      vi.useFakeTimers();
      confirmModalImpl = () => Promise.reject(new Error('rejected-by-user'));

      route = { query: { 'x-success': encodeURIComponent('https://attacker.example/') } };
      setup();

      await (await loadApi()).openCallbackOrGoHome(true);
      vi.runAllTimers();

      // Rejection routes home and skips `window.open` entirely.
      expect(routerReplace).toHaveBeenCalledWith({ name: 'account' });
      expect(windowOpen).not.toHaveBeenCalled();
    });

    it.each([
      // Suffix spoofing: same seven letters at the end, different owner.
      'https://evilsuperhero.com/',
      // `superhero.com` in a path/query is not the destination host.
      'https://attacker.example/?r=https://superhero.com',
      // Prefix spoofing: the real host is `attacker.example`.
      'https://superhero.com.attacker.example/',
    ])('still prompts for spoof-shaped URL %s', async (spoofedUrl) => {
      vi.useFakeTimers();
      route = { query: { 'x-success': encodeURIComponent(spoofedUrl) } };
      setup();

      await (await loadApi()).openCallbackOrGoHome(true);
      vi.runAllTimers();

      expect(openConfirmModalMock).toHaveBeenCalledTimes(1);
    });

    it('warns before redirecting to an http (downgraded) superhero.com callback', async () => {
      vi.useFakeTimers();
      route = {
        query: { 'x-success': encodeURIComponent('http://superhero.com/?s={signature}') },
      };
      setup();

      await (await loadApi()).openCallbackOrGoHome(true, { signature: 'SIG123' });
      vi.runAllTimers();

      expect(loggerWrite).not.toHaveBeenCalled();
      expect(openConfirmModalMock).toHaveBeenCalledTimes(1);
      expect(windowOpen).toHaveBeenCalledWith('http://superhero.com/?s=SIG123', '_self');
    });

    it('warns before redirecting to localhost-style http callbacks', async () => {
      vi.useFakeTimers();
      route = {
        query: {
          'x-success': encodeURIComponent('http://192.168.100.42:5173/callback?s={signature}'),
        },
      };
      setup();

      await (await loadApi()).openCallbackOrGoHome(true, { signature: 'SIG123' });
      vi.runAllTimers();

      expect(openConfirmModalMock).toHaveBeenCalledTimes(1);
      expect(windowOpen).toHaveBeenCalledWith(
        'http://192.168.100.42:5173/callback?s=SIG123',
        '_self',
      );
    });
  });

  describe('template expansion', () => {
    it('does not double-decode an already-decoded callback template', async () => {
      vi.useFakeTimers();
      route = {
        // Simulates Vue Router having already decoded the outer x-success value.
        // `%26` is data inside the payload and must stay encoded when redirected.
        query: { 'x-success': 'http://localhost:3000/callback?payload=A%26B&sig={signature}' },
      };
      setup();

      await (await loadApi()).openCallbackOrGoHome(true, { signature: 'SIG123' });
      vi.runAllTimers();

      expect(windowOpen).toHaveBeenCalledWith(
        'http://localhost:3000/callback?payload=A%26B&sig=SIG123',
        '_self',
      );
    });

    it('substitutes template params literally even when keys contain regex-special chars', async () => {
      vi.useFakeTimers();
      route = {
        query: {
          'x-success': encodeURIComponent(
            'http://localhost:3000/callback?v={sig$}&name={name.with.dot}',
          ),
        },
      };
      setup();

      await (await loadApi()).openCallbackOrGoHome(true, {
        sig$: 'abc123',
        'name.with.dot': 'john/doe',
      });
      vi.runAllTimers();

      expect(windowOpen).toHaveBeenCalledWith(
        'http://localhost:3000/callback?v=abc123&name=john%2Fdoe',
        '_self',
      );
    });
  });
});
