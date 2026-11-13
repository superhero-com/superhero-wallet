import { flushPromises } from '@vue/test-utils';
import {
  createMemoryHistory,
  createRouter,
  type NavigationGuard,
  type RouteLocationNormalizedLoaded,
  type RouteRecordRaw,
} from 'vue-router';
import { RouteLastUsedRoutes } from '@/lib/RouteLastUsedRoutes';
import { ROUTE_ACCOUNT_DETAILS, ROUTE_ACCOUNT_DETAILS_ASSETS } from '@/popup/router/routeNames';

const { platform, storage, handleUnknownError } = vi.hoisted(() => ({
  platform: {
    IS_IOS: true,
    IS_MOBILE_APP: true,
    RUNNING_IN_POPUP: false,
    STORAGE_KEYS: { lastRoute: 'last-route' },
  },
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
  handleUnknownError: vi.fn(),
}));

vi.mock('@/constants', () => platform);
vi.mock('@/lib/WalletStorage', () => ({ WalletStorage: storage }));
vi.mock('@/utils', () => ({ handleUnknownError }));

const NOW = new Date('2026-11-13T10:00:00Z');
const Page = { render: () => null };
const mountedPages: HTMLElement[] = [];

interface RouterOptions {
  mountAutomatically?: boolean;
  isLoggedIn?: boolean;
  beforeAuth?: NavigationGuard;
  hasTokensSupport?: () => boolean;
}

function makeRouter(extraRoutes: RouteRecordRaw[] = [], {
  mountAutomatically = true,
  isLoggedIn = true,
  beforeAuth,
  hasTokensSupport,
}: RouterOptions = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/', name: 'index', component: Page, meta: { notPersist: true, ifNotAuthOnly: true },
      },
      { path: '/account', name: 'account', component: Page },
      { path: '/more', name: 'more', component: Page },
      { path: '/more/about', name: 'about', component: Page },
      {
        path: '/login', name: 'login', component: Page, meta: { notPersist: true },
      },
      // Like the app, unknown paths match a redirecting catch-all.
      { path: '/:pathMatch(.*)*', redirect: '/' },
      ...extraRoutes,
    ],
  });
  const visited: string[] = [];
  // Keep controller tests independent of Ionic rendering.
  function mountPage(route: RouteLocationNormalizedLoaded = router.currentRoute.value) {
    const record = route.matched[0];
    const element = document.createElement('div');
    element.classList.add('ion-page');
    document.body.append(element);
    mountedPages.push(element);
    record.instances.default = { $el: element } as typeof record.instances.default;
  }
  router.afterEach((to, _from, failure) => {
    if (!failure) {
      visited.push(to.fullPath);
      if (mountAutomatically) mountPage();
    }
  });
  const auth = { isLoggedIn, loginTarget: '/account' };
  const restoration = RouteLastUsedRoutes.init(router, hasTokensSupport);
  if (beforeAuth) router.beforeEach(beforeAuth);
  router.beforeEach((to) => {
    if (!auth.isLoggedIn) {
      if (to.meta.ifNotAuth || to.meta.ifNotAuthOnly) return undefined;
      auth.loginTarget = restoration?.waitForLogin(to) ?? to.fullPath;
      return { name: 'index' };
    }
    if (to.meta.ifNotAuthOnly) return { name: 'account' };
    return restoration?.restoreAfterAuth(to);
  });
  return {
    router, visited, mountPage, auth,
  };
}

function saveRoute(path = '/more/about', age = 0) {
  const saved = { path, time: new Date(NOW.getTime() - age).toISOString() };
  storage.get.mockReturnValue(saved);
  return saved;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
  storage.get.mockReturnValue(null);
  Object.assign(platform, { IS_IOS: true, IS_MOBILE_APP: true, RUNNING_IN_POPUP: false });
});

afterEach(() => {
  mountedPages.splice(0).forEach((element) => element.remove());
  vi.useRealTimers();
});

describe('last visited route restoration', () => {
  it('mounts the iOS parent before restoring the full path, even when the parent is not persisted', async () => {
    const saved = saveRoute('/more/about/?returnTo=/account/details#versions');
    const { router, visited } = makeRouter([
      {
        path: '/more', name: 'more', component: Page, meta: { notPersist: true },
      },
    ]);

    await router.push('/');
    await flushPromises();

    await vi.waitFor(() => expect(visited).toEqual(['/more', saved.path]));
    expect(router.currentRoute.value.query).toEqual({ returnTo: '/account/details' });
    expect(router.currentRoute.value.hash).toBe('#versions');
    expect(storage.remove).not.toHaveBeenCalled();
    expect(storage.set).toHaveBeenCalledExactlyOnceWith('last-route', {
      path: saved.path, time: expect.any(String),
    });

    router.back();
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/more');
  });

  it('uses an explicit back route instead of the path parent', async () => {
    saveRoute('/transactions/hash?tab=info#details');
    const { router, visited } = makeRouter([
      { path: '/account-details', name: 'account-details', component: Page },
      {
        path: '/transactions/:hash',
        component: Page,
        meta: { backRoute: { name: 'account-details' } },
      },
    ]);

    await router.push('/');
    await flushPromises();

    await vi.waitFor(() => expect(visited).toEqual([
      '/account-details', '/transactions/hash?tab=info#details',
    ]));
  });

  it.each([
    ['a missing parent', []],
    ['a parent with a guard', [{ path: '/guarded', component: Page, beforeEnter: vi.fn() }]],
    ['a redirecting parent', [{ path: '/guarded', redirect: '/more' }]],
  ])('uses the dashboard for %s', async (_description, parents) => {
    saveRoute('/guarded/child');
    const { router, visited } = makeRouter([
      ...parents as RouteRecordRaw[],
      { path: '/guarded/child', component: Page },
    ]);

    await router.push('/');
    await flushPromises();

    await vi.waitFor(() => expect(visited).toEqual(['/account', '/guarded/child']));
    if (parents[0] && 'beforeEnter' in parents[0]) {
      expect(parents[0].beforeEnter).not.toHaveBeenCalled();
    }
  });

  it('restores the dashboard without pushing it twice', async () => {
    saveRoute('/account');
    const { router, visited } = makeRouter();

    await router.push('/');
    await flushPromises();

    expect(visited).toEqual(['/account']);
  });

  it.each([
    ['an expired route', { path: '/more/about', time: '2026-11-13T09:49:59Z' }],
    ['a route exactly ten minutes old', { path: '/more/about', time: '2026-11-13T09:50:00Z' }],
    ['a route without a timestamp', { path: '/more/about' }],
    ['an invalid timestamp', { path: '/more/about', time: 'invalid' }],
    ['an empty path', { path: '', time: NOW.toISOString() }],
    ['no saved route', null],
  ])('does not restore %s', async (_description, saved) => {
    storage.get.mockReturnValue(saved);
    const { router, visited } = makeRouter([], { isLoggedIn: false });

    await router.push('/');
    await flushPromises();

    expect(visited).toEqual(['/']);
    expect(storage.set).not.toHaveBeenCalled();
    expect(storage.remove).toHaveBeenCalledExactlyOnceWith('last-route');
  });

  it('restores a route just under ten minutes old', async () => {
    saveRoute('/more/about', 599999);
    const { router, visited } = makeRouter();

    await router.push('/');
    await flushPromises();

    await vi.waitFor(() => expect(visited).toEqual(['/more', '/more/about']));
  });

  it.each([
    ['Android', { IS_IOS: false, IS_MOBILE_APP: true }],
    ['web on iOS', { IS_IOS: true, IS_MOBILE_APP: false }],
    ['desktop', { IS_IOS: false, IS_MOBILE_APP: false }],
  ])('keeps direct restoration on %s', async (_description, flags) => {
    Object.assign(platform, flags);
    saveRoute();
    const { router, visited } = makeRouter();

    await router.push('/');
    await flushPromises();

    expect(visited).toEqual(['/more/about']);
  });

  it('leaves popup navigation and persistence alone', async () => {
    platform.RUNNING_IN_POPUP = true;
    saveRoute();
    const { router, visited } = makeRouter([
      {
        path: '/', name: 'index', component: Page, meta: { notPersist: true },
      },
    ]);

    await router.push('/');
    await router.push('/more');
    await flushPromises();

    expect(visited).toEqual(['/', '/more']);
    expect(storage.get).not.toHaveBeenCalled();
    expect(storage.set).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled();
  });

  it('honors a direct launch destination instead of the saved page', async () => {
    saveRoute();
    const { router, visited } = makeRouter();

    await router.push('/more?source=link');
    await router.push('/');
    await flushPromises();

    expect(visited).toEqual(['/more?source=link', '/account']);
    expect(storage.get).not.toHaveBeenCalled();
  });

  it('does not resurrect the saved page after an unrelated guard redirects its parent', async () => {
    saveRoute();
    const { router, visited } = makeRouter([], {
      beforeAuth: (to) => (to.path === '/more' ? '/login' : undefined),
    });

    await router.push('/');
    await flushPromises();

    expect(visited).toEqual(['/login']);
    expect(storage.remove).toHaveBeenCalledExactlyOnceWith('last-route');
    expect(storage.set).not.toHaveBeenCalled();
  });

  it('preserves the saved page when a guard rejects its temporary parent', async () => {
    const saved = saveRoute();
    const { router, visited } = makeRouter([], {
      beforeAuth: (to) => to.path !== '/more',
    });

    await router.push('/');
    await flushPromises();

    expect(visited).toEqual([]);
    expect(storage.set).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled();

    await router.push(saved.path);
    await flushPromises();
    expect(visited).toEqual([saved.path]);
  });

  it('preserves the saved destination when its own guard rejects restoration', async () => {
    const saved = saveRoute();
    let rejectRestoration = true;
    const guard = vi.fn<NavigationGuard>((to) => !rejectRestoration || to.path !== '/more/about');
    const { router, visited } = makeRouter([], { beforeAuth: guard });

    await router.push('/');
    await flushPromises();
    await vi.waitFor(() => expect(guard.mock.calls.some(([to]) => to.path === '/more/about')).toBe(true));

    expect(visited).toEqual([]);
    expect(storage.set).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled();

    rejectRestoration = false;
    await router.push(saved.path);
    await flushPromises();
    expect(visited).toEqual([saved.path]);
  });

  it('lets a new navigation take priority while the temporary parent is mounting', async () => {
    saveRoute();
    const { router, visited } = makeRouter();
    router.afterEach((to, _from, failure) => {
      if (!failure && to.path === '/more') router.push('/login');
    });

    await router.push('/');
    await flushPromises();

    expect(visited).toEqual(['/more', '/login']);
    expect(storage.set).not.toHaveBeenCalled();
  });

  it('waits for an asynchronous parent page before restoring its child', async () => {
    saveRoute();
    const { router, visited, mountPage } = makeRouter([], { mountAutomatically: false });

    await router.push('/');
    await flushPromises();

    expect(visited).toEqual(['/more']);
    expect(storage.set).not.toHaveBeenCalled();

    mountPage();
    await vi.waitFor(() => expect(visited).toEqual(['/more', '/more/about']));
  });

  it('does not restore after navigating away from a parent that is still loading', async () => {
    saveRoute();
    const { router, visited, mountPage } = makeRouter([], { mountAutomatically: false });

    await router.push('/');
    await flushPromises();
    const parent = router.currentRoute.value;
    await router.push('/login');
    mountPage(parent);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await flushPromises();

    expect(visited).toEqual(['/more', '/login']);
    expect(storage.set).not.toHaveBeenCalled();
  });

  it('does not restore after the parent that is still loading is opened again', async () => {
    saveRoute();
    const { router, visited, mountPage } = makeRouter([], { mountAutomatically: false });

    await router.push('/');
    await flushPromises();
    // Like a deep link to the page already shown: vue-router skips the guards for it
    await router.push('/more');
    mountPage();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await flushPromises();

    expect(visited).toEqual(['/more']);
    expect(router.currentRoute.value.fullPath).toBe('/more');
  });

  it('opens the saved page when its parent shows no page', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    saveRoute();
    const { router, visited } = makeRouter([], { mountAutomatically: false });

    await router.push('/');
    await flushPromises();
    await vi.advanceTimersByTimeAsync(2900);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await flushPromises();
    expect(visited).toEqual(['/more']);

    await vi.advanceTimersByTimeAsync(100);
    await vi.waitFor(() => expect(visited).toEqual(['/more', '/more/about']));
  });

  it.each([false, true])('restores a public page with logged-in state %s', async (isLoggedIn) => {
    const saved = saveRoute('/more/about/terms?section=privacy#terms');
    const { router, visited, auth } = makeRouter([
      { path: '/more/about/terms', component: Page, meta: { ifNotAuth: true } },
    ], { isLoggedIn });

    await router.push('/');
    await vi.waitFor(() => expect(visited).toEqual(isLoggedIn
      ? ['/more/about', saved.path]
      : [saved.path]));

    expect(router.currentRoute.value.fullPath).toBe(saved.path);
    expect(auth.loginTarget).toBe('/account');
    expect(storage.remove).not.toHaveBeenCalled();
    expect(storage.set).toHaveBeenCalledExactlyOnceWith('last-route', {
      path: saved.path, time: expect.any(String),
    });
    if (isLoggedIn) {
      router.back();
      await flushPromises();
      expect(router.currentRoute.value.path).toBe('/more/about');
    }
  });

  it.each(['target', 'parent'])('preserves the destination and back stack after authentication fails at the %s', async (stage) => {
    const saved = saveRoute('/more/about?details=1#version');
    let lockParent = stage === 'parent';
    const { router, visited, auth } = makeRouter([], {
      isLoggedIn: stage === 'parent',
      beforeAuth: (to) => {
        if (!lockParent || to.path !== '/more') return;
        lockParent = false;
        auth.isLoggedIn = false;
      },
    });

    await router.push('/');
    await flushPromises();
    expect(visited).toEqual(['/']);
    expect(auth.loginTarget).toBe(saved.path);
    expect(storage.set).not.toHaveBeenCalled();

    auth.isLoggedIn = true;
    await router.push(auth.loginTarget);
    await vi.waitFor(() => expect(visited).toEqual(['/', '/more', saved.path]));
    expect(router.currentRoute.value.fullPath).toBe(saved.path);

    router.back();
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/more');
  });

  it('does not resume restoration after an unrelated redirect to the login page', async () => {
    const saved = saveRoute();
    let redirect = true;
    const { router, visited, auth } = makeRouter([], {
      isLoggedIn: false,
      beforeAuth: (to) => {
        if (to.fullPath !== saved.path || !redirect) return undefined;
        redirect = false;
        return '/';
      },
    });

    await router.push('/');
    expect(visited).toEqual(['/']);
    expect(auth.loginTarget).toBe('/account');

    auth.isLoggedIn = true;
    await router.push(saved.path);
    await flushPromises();
    expect(visited).toEqual(['/', saved.path]);
  });

  it('discards deferred restoration when the user navigates elsewhere before login resumes', async () => {
    const saved = saveRoute();
    const { router, visited, auth } = makeRouter([], { isLoggedIn: false });

    await router.push('/');
    auth.isLoggedIn = true;
    await router.push('/account');
    await router.push(saved.path);
    await flushPromises();

    expect(visited).toEqual(['/', '/account', saved.path]);
  });

  it('ignores stale authentication when a new navigation uses the same saved URL', async () => {
    const saved = saveRoute();
    let resumeAuth: (() => void) | undefined;
    let authPending = false;
    const { router, visited } = makeRouter([], {
      beforeAuth: async (to) => {
        if (to.fullPath !== saved.path || authPending) return;
        authPending = true;
        await new Promise<void>((resolve) => { resumeAuth = resolve; });
      },
    });

    const firstNavigation = router.push('/');
    await vi.waitFor(() => expect(resumeAuth).toBeDefined());
    await router.push(saved.path);
    await flushPromises();
    expect(visited).toEqual([saved.path]);

    resumeAuth!();
    await firstNavigation;
    await flushPromises();
    expect(visited).toEqual([saved.path]);
    expect(router.currentRoute.value.fullPath).toBe(saved.path);
  });

  it.each([true, false])('runs destination reauthentication once when it returns %s and skips the guarded parent', async (accepted) => {
    const saved = saveRoute('/more/settings/seed-phrase/details/verify');
    const parentGuard = vi.fn(() => true);
    const destinationGuard = vi.fn(() => accepted);
    const { router, visited } = makeRouter([
      { path: '/more/settings/seed-phrase/details', component: Page, beforeEnter: parentGuard },
      { path: saved.path, component: Page, beforeEnter: destinationGuard },
    ]);

    await router.push('/');
    await vi.waitFor(() => expect(destinationGuard).toHaveBeenCalledOnce());
    await flushPromises();

    expect(visited).toEqual(accepted ? ['/account', saved.path] : ['/account']);
    expect(router.currentRoute.value.fullPath).toBe(accepted ? saved.path : '/account');
    expect(parentGuard).not.toHaveBeenCalled();
    if (!accepted) expect(storage.set).not.toHaveBeenCalled();
  });

  it.each([
    [true, '/account-details/assets'],
    [false, '/account-details'],
  ])('checks tokens support after account readiness to pick the coin parent (support: %s)', async (hasTokens, parentPath) => {
    const saved = saveRoute('/coins/bitcoin/details');
    let resumeAuth: (() => void) | undefined;
    let accountReady = false;
    const hasTokensSupport = vi.fn(() => hasTokens);
    const { router, visited } = makeRouter([
      { path: '/account-details', name: ROUTE_ACCOUNT_DETAILS, component: Page },
      {
        path: '/account-details/assets',
        name: ROUTE_ACCOUNT_DETAILS_ASSETS,
        component: Page,
        meta: { redirectIfNull: ROUTE_ACCOUNT_DETAILS },
      },
      {
        path: saved.path,
        component: Page,
        meta: { backRoute: { name: ROUTE_ACCOUNT_DETAILS_ASSETS } },
      },
    ], {
      hasTokensSupport,
      beforeAuth: async (to) => {
        if (to.fullPath !== saved.path || accountReady) return;
        await new Promise<void>((resolve) => { resumeAuth = resolve; });
      },
    });

    const navigation = router.push('/');
    await vi.waitFor(() => expect(resumeAuth).toBeDefined());
    expect(hasTokensSupport).not.toHaveBeenCalled();
    expect(visited).toEqual([]);

    accountReady = true;
    resumeAuth!();
    await navigation;
    await vi.waitFor(() => expect(visited).toEqual([parentPath, saved.path]));
    expect(hasTokensSupport).toHaveBeenCalledOnce();
  });
});
