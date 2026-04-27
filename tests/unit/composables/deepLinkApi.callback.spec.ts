// @ts-nocheck
/**
 * Unit tests for HIGH-09 — the callback-URL validation layer added to
 * `useDeepLinkApi.openCallbackOrGoHome`. Everything outside of the
 * validation flow (router, modals, logger, window.open, timers) is mocked so
 * the tests pin down exactly:
 *   1. dangerous schemes are rejected outright,
 *   2. malformed URLs are rejected outright,
 *   3. the trusted aggregator origin is redirected to without a prompt,
 *   4. any other origin requires an explicit confirm-modal approval, and
 *   5. user rejection on that modal prevents the redirect.
 */
describe('useDeepLinkApi.openCallbackOrGoHome — security gating (HIGH-09)', () => {
  const routerReplace = jest.fn();
  const loggerWrite = jest.fn();
  const windowOpen = jest.fn();
  const openConfirmModalMock = jest.fn();
  let confirmModalImpl: () => Promise<void>;
  let route: { query: Record<string, string> };

  const validateCallbackUrl = (rawUrl: string) => {
    try {
      const url = new URL(rawUrl);
      if (url.protocol === 'https:') return url;
      if (
        url.protocol === 'http:'
        && ['localhost', '0.0.0.0'].includes(url.hostname)
      ) return url;
      if (url.protocol === 'http:' && /^127(?:\.\d{1,3}){3}$/.test(url.hostname)) return url;
      return null;
    } catch {
      return null;
    }
  };

  const isTrustedCallbackUrl = (url: URL) => (
    url.protocol === 'https:'
    && (
      url.hostname === 'superhero.com'
      || url.hostname.endsWith('.superhero.com')
    )
  );

  const setup = () => {
    jest.resetModules();
    routerReplace.mockClear();
    loggerWrite.mockClear();
    windowOpen.mockClear();
    openConfirmModalMock.mockClear();

    jest.doMock('vue-router', () => ({
      useRoute: () => route,
      RouteLocationNormalized: class {},
    }));
    jest.doMock('@ionic/vue', () => ({
      useIonRouter: () => ({ replace: routerReplace }),
    }));
    jest.doMock('@/popup/router/routeNames', () => ({ ROUTE_ACCOUNT: 'account' }));
    jest.doMock('@/utils', () => ({
      checkIfSuperheroCallbackUrl: () => false,
      isTrustedCallbackUrl,
      validateCallbackUrl,
    }));
    jest.doMock('@/constants', () => ({
      AGGREGATOR_URL: 'https://superhero.com',
      IS_IOS: false,
      IS_MOBILE_APP: false,
      IS_WEB: true,
      MODAL_TRANSFER_SEND: 'transfer-send',
    }));
    jest.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openModal: jest.fn(),
        openConfirmModal: openConfirmModalMock,
      }),
    }));
    jest.doMock('@/lib/logger', () => ({
      __esModule: true,
      default: { write: loggerWrite },
    }));
    jest.doMock('@/popup/plugins/i18n', () => ({
      tg: (key: string, params: Record<string, string> = {}) => {
        if (key === 'pages.deepLink.invalidCallbackTitle') {
          return 'Localized invalid callback title';
        }
        if (key === 'pages.deepLink.invalidCallbackMsg') {
          return `Localized invalid callback message: ${params.url}`;
        }
        if (key === 'pages.deepLink.externalCallbackMsg') {
          return `Localized external callback message: ${params.url}`;
        }
        return key;
      },
    }));

    // Stub `window.open` on the jsdom window used by jest
    (global as any).window = Object.assign((global as any).window || {}, {
      open: windowOpen,
    });
  };

  beforeEach(() => {
    confirmModalImpl = () => Promise.resolve();
    openConfirmModalMock.mockImplementation(() => confirmModalImpl());
    route = { query: {} };
    setup();
  });

  it('rejects javascript: callback without any redirect and logs a modal-visible error', async () => {
    route = {
      query: {
        // eslint-disable-next-line no-script-url
        'x-success': encodeURIComponent('javascript:alert(1)'),
      },
    };
    setup();

    // eslint-disable-next-line global-require
    const { useDeepLinkApi } = require('@/composables/deepLinkApi');
    const api = useDeepLinkApi();
    await api.openCallbackOrGoHome(true);

    expect(loggerWrite).toHaveBeenCalledTimes(1);
    const [writeArgs] = loggerWrite.mock.calls[0];
    expect(writeArgs.title).toBe('Localized invalid callback title');
    expect(writeArgs.message).toBe('Localized invalid callback message: javascript:alert(1)');
    expect(writeArgs.modal).toBe(true);
    // Router redirects home, but `window.open` must NEVER be called for a
    // dangerous scheme.
    expect(routerReplace).toHaveBeenCalledWith({ name: 'account' });
    expect(windowOpen).not.toHaveBeenCalled();
  });

  it.each([
    ['data: payload', 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='],
    ['file: path', 'file:///etc/passwd'],
    ['vbscript: payload', 'vbscript:msgbox'],
    ['blob: URL', 'blob:https://example.com/abc'],
    ['chrome-extension: URL', 'chrome-extension://abc/popup.html'],
    ['custom app scheme', 'myapp://callback?signature={signature}'],
    ['intent scheme', 'intent://wallet/callback#Intent;scheme=myapp;end'],
    ['mailto scheme', 'mailto:test@example.com?body={signature}'],
  ])('rejects %s without redirecting', async (_label, rawUrl) => {
    route = { query: { 'x-success': encodeURIComponent(rawUrl) } };
    setup();

    // eslint-disable-next-line global-require
    const { useDeepLinkApi } = require('@/composables/deepLinkApi');
    await useDeepLinkApi().openCallbackOrGoHome(true);

    expect(loggerWrite).toHaveBeenCalledTimes(1);
    expect(windowOpen).not.toHaveBeenCalled();
  });

  it('rejects malformed callback URLs', async () => {
    route = { query: { 'x-success': encodeURIComponent('not a url at all') } };
    setup();

    // eslint-disable-next-line global-require
    const { useDeepLinkApi } = require('@/composables/deepLinkApi');
    await useDeepLinkApi().openCallbackOrGoHome(true);

    expect(loggerWrite).toHaveBeenCalledTimes(1);
    expect(windowOpen).not.toHaveBeenCalled();
  });

  it('redirects to the trusted aggregator origin without a confirmation prompt', async () => {
    jest.useFakeTimers();
    route = {
      query: { 'x-success': encodeURIComponent('https://superhero.com/callback?a=1') },
    };
    setup();

    // openConfirmModal must NOT be awaited; if it were, this promise would
    // hang until we resolved `confirmModalImpl`.
    confirmModalImpl = () => {
      throw new Error('openConfirmModal should not be called for trusted origin');
    };

    // eslint-disable-next-line global-require
    const { useDeepLinkApi } = require('@/composables/deepLinkApi');
    const openPromise = useDeepLinkApi().openCallbackOrGoHome(true);
    await openPromise;

    // `setTimeout(() => openCallbackUrl(...), 0)` on IS_WEB=true path
    jest.runAllTimers();

    expect(loggerWrite).not.toHaveBeenCalled();
    expect(routerReplace).toHaveBeenCalledWith({ name: 'account' });
    expect(windowOpen).toHaveBeenCalledWith('https://superhero.com/callback?a=1', '_self');
    jest.useRealTimers();
  });

  it('requires user confirmation for non-trusted origins before redirecting', async () => {
    jest.useFakeTimers();
    let resolveModal: (v?: unknown) => void;
    confirmModalImpl = () => new Promise((resolve) => { resolveModal = resolve; });

    route = {
      query: { 'x-success': encodeURIComponent('https://attacker.example/?s={signature}') },
    };
    setup();

    // eslint-disable-next-line global-require
    const { useDeepLinkApi } = require('@/composables/deepLinkApi');
    const openPromise = useDeepLinkApi().openCallbackOrGoHome(true, { signature: 'SIG123' });

    // At this point the composable is awaiting the confirm modal. Nothing
    // should have been opened yet.
    await Promise.resolve();
    expect(windowOpen).not.toHaveBeenCalled();
    expect(openConfirmModalMock).toHaveBeenCalledWith({
      title: 'pages.deepLink.externalCallbackTitle',
      msg: 'Localized external callback message: https://attacker.example/?s=SIG123',
    });

    // User approves.
    resolveModal!();
    await openPromise;
    jest.runAllTimers();

    // The `{signature}` template must be substituted (URI-encoded) into the
    // callback URL that ultimately reaches `window.open`.
    expect(windowOpen).toHaveBeenCalledTimes(1);
    const [forwardedUrl] = windowOpen.mock.calls[0];
    expect(forwardedUrl).toContain('https://attacker.example/?s=SIG123');
    jest.useRealTimers();
  });

  it('cancels the redirect when the user rejects the external-site confirmation', async () => {
    jest.useFakeTimers();
    confirmModalImpl = () => Promise.reject(new Error('rejected-by-user'));

    route = {
      query: { 'x-success': encodeURIComponent('https://attacker.example/') },
    };
    setup();

    // eslint-disable-next-line global-require
    const { useDeepLinkApi } = require('@/composables/deepLinkApi');
    await useDeepLinkApi().openCallbackOrGoHome(true);
    jest.runAllTimers();

    // Rejection must route the user home and skip `window.open` entirely.
    expect(routerReplace).toHaveBeenCalledWith({ name: 'account' });
    expect(windowOpen).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('redirects home without logging or opening when no x-success query is present', async () => {
    route = { query: {} };
    setup();

    // eslint-disable-next-line global-require
    const { useDeepLinkApi } = require('@/composables/deepLinkApi');
    await useDeepLinkApi().openCallbackOrGoHome(true);

    expect(loggerWrite).not.toHaveBeenCalled();
    expect(routerReplace).toHaveBeenCalledWith({ name: 'account' });
    expect(windowOpen).not.toHaveBeenCalled();
  });

  it.each([
    'https://chat.superhero.com/callback',
    'https://wallet.superhero.com/success',
    'https://deep.nested.superhero.com/a/b',
  ])('treats %s as trusted and skips the confirm prompt', async (trustedUrl) => {
    jest.useFakeTimers();
    route = { query: { 'x-success': encodeURIComponent(trustedUrl) } };
    setup();
    confirmModalImpl = () => {
      throw new Error('openConfirmModal must not be called for superhero.com subdomains');
    };

    // eslint-disable-next-line global-require
    const { useDeepLinkApi } = require('@/composables/deepLinkApi');
    await useDeepLinkApi().openCallbackOrGoHome(true);
    jest.runAllTimers();

    expect(loggerWrite).not.toHaveBeenCalled();
    expect(windowOpen).toHaveBeenCalledWith(trustedUrl, '_self');
    jest.useRealTimers();
  });

  it.each([
    // Suffix spoofing: same seven letters at the end, different owner.
    'https://evilsuperhero.com/',
    // Embedded hostname: `superhero.com` as a path / query / credential
    // is not the destination host and must not grant trust.
    'https://attacker.example/?r=https://superhero.com',
    'https://superhero.com.attacker.example/',
  ])('still prompts for spoof-shaped URL %s', async (spoofedUrl) => {
    jest.useFakeTimers();
    let confirmCalled = 0;
    confirmModalImpl = () => { confirmCalled += 1; return Promise.resolve(); };

    route = { query: { 'x-success': encodeURIComponent(spoofedUrl) } };
    setup();

    // eslint-disable-next-line global-require
    const { useDeepLinkApi } = require('@/composables/deepLinkApi');
    await useDeepLinkApi().openCallbackOrGoHome(true);
    jest.runAllTimers();

    expect(confirmCalled).toBe(1);
    jest.useRealTimers();
  });

  it('rejects non-loopback http callbacks without redirecting', async () => {
    route = {
      query: { 'x-success': encodeURIComponent('http://superhero.com/?s={signature}') },
    };
    setup();

    // eslint-disable-next-line global-require
    const { useDeepLinkApi } = require('@/composables/deepLinkApi');
    await useDeepLinkApi().openCallbackOrGoHome(true, { signature: 'SIG123' });

    expect(loggerWrite).toHaveBeenCalledTimes(1);
    expect(openConfirmModalMock).not.toHaveBeenCalled();
    expect(windowOpen).not.toHaveBeenCalled();
  });

  it('allows loopback http callbacks but still requires confirmation', async () => {
    jest.useFakeTimers();
    confirmModalImpl = () => Promise.resolve();
    route = {
      query: { 'x-success': encodeURIComponent('http://localhost:3000/callback?s={signature}') },
    };
    setup();

    // eslint-disable-next-line global-require
    const { useDeepLinkApi } = require('@/composables/deepLinkApi');
    await useDeepLinkApi().openCallbackOrGoHome(true, { signature: 'SIG123' });
    jest.runAllTimers();

    expect(openConfirmModalMock).toHaveBeenCalledTimes(1);
    expect(windowOpen).toHaveBeenCalledWith('http://localhost:3000/callback?s=SIG123', '_self');
    jest.useRealTimers();
  });

  it('does not double-decode already-decoded callback templates from router query', async () => {
    jest.useFakeTimers();
    confirmModalImpl = () => Promise.resolve();
    route = {
      // Simulates Vue Router already decoding the outer x-success parameter.
      // `%26` is data inside payload and must stay encoded when redirected.
      query: { 'x-success': 'http://localhost:3000/callback?payload=A%26B&sig={signature}' },
    };
    setup();
    // eslint-disable-next-line global-require
    const { useDeepLinkApi } = require('@/composables/deepLinkApi');
    await useDeepLinkApi().openCallbackOrGoHome(true, { signature: 'SIG123' });
    jest.runAllTimers();
    expect(windowOpen).toHaveBeenCalledWith(
      'http://localhost:3000/callback?payload=A%26B&sig=SIG123',
      '_self',
    );
    jest.useRealTimers();
  });

  it('routes home without throwing when x-success contains malformed percent-encoding', async () => {
    route = { query: { 'x-success': '%ZZ' } };
    setup();

    // eslint-disable-next-line global-require
    const { useDeepLinkApi } = require('@/composables/deepLinkApi');
    // The call MUST resolve (not reject). Previously a URIError thrown from
    // `decodeURIComponent` would propagate out as an unhandled rejection
    // since every caller invokes this function fire-and-forget.
    await expect(useDeepLinkApi().openCallbackOrGoHome(true)).resolves.toBeUndefined();

    expect(routerReplace).toHaveBeenCalledWith({ name: 'account' });
    expect(windowOpen).not.toHaveBeenCalled();
  });

  it('substitutes template params as literals even when keys contain regex-special chars', async () => {
    jest.useFakeTimers();
    confirmModalImpl = () => Promise.resolve();
    route = {
      query: { 'x-success': encodeURIComponent('http://localhost:3000/callback?v={sig$}&name={name.with.dot}') },
    };
    setup();

    // eslint-disable-next-line global-require
    const { useDeepLinkApi } = require('@/composables/deepLinkApi');
    await useDeepLinkApi().openCallbackOrGoHome(true, {
      sig$: 'abc123',
      'name.with.dot': 'john/doe',
    });
    jest.runAllTimers();

    expect(windowOpen).toHaveBeenCalledWith(
      'http://localhost:3000/callback?v=abc123&name=john%2Fdoe',
      '_self',
    );
    jest.useRealTimers();
  });

  it('awaits invalid-callback logger modal before redirecting home', async () => {
    route = {
      query: {
        // eslint-disable-next-line no-script-url
        'x-success': encodeURIComponent('javascript:alert(1)'),
      },
    };
    setup();

    let resolveLogger: () => void;
    loggerWrite.mockImplementationOnce(
      () => new Promise((resolve) => { resolveLogger = resolve; }),
    );

    // eslint-disable-next-line global-require
    const { useDeepLinkApi } = require('@/composables/deepLinkApi');
    const openPromise = useDeepLinkApi().openCallbackOrGoHome(true);

    await Promise.resolve();
    expect(routerReplace).not.toHaveBeenCalled();

    resolveLogger!();
    await openPromise;
    expect(routerReplace).toHaveBeenCalledWith({ name: 'account' });
  });
});
