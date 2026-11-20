/**
 * The last page restored on iOS through the app's router and its own guards.
 * The restoration itself is covered by `RouteLastUsedRoutes.spec.ts`.
 */
import type { RouteLocationNormalized, Router } from 'vue-router';

const { storage, setLoginTargetLocation } = vi.hoisted(() => ({
  storage: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
  setLoginTargetLocation: vi.fn(),
}));

vi.mock('@/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/constants')>()),
  IS_IOS: true,
  IS_MOBILE_APP: true,
  IS_WEB: false,
  RUNNING_IN_POPUP: false,
}));
// Without Ionic's page stack: the pages are mounted by hand below
vi.mock('@ionic/vue-router', async () => {
  const { createRouter, createMemoryHistory } = await import('vue-router');
  return {
    createRouter,
    createWebHashHistory: createMemoryHistory,
    createWebHistory: createMemoryHistory,
  };
});
vi.mock('@/popup/router/routes', () => {
  const Page = { render: () => null };
  return {
    routes: [
      {
        path: '/', name: 'index', component: Page, meta: { ifNotAuthOnly: true, notPersist: true },
      },
      { path: '/account', name: 'account', component: Page },
      { path: '/more', name: 'more', component: Page },
      { path: '/more/about', name: 'about', component: Page },
      {
        path: '/page-not-found',
        name: 'not-found',
        component: Page,
        meta: { ifNotAuth: true, notPersist: true },
      },
    ],
  };
});
vi.mock('@/composables', async () => {
  const { ref } = await import('vue');
  const accounts = {
    activeAccount: ref({ protocol: 'aeternity' }),
    isLoggedIn: ref(true),
    areAccountsReady: ref(true),
  };
  return {
    useAccounts: () => accounts,
    useAuth: () => ({ checkUserAuth: async () => {}, isAuthenticated: ref(true) }),
    usePopupProps: () => ({ setPopupProps: vi.fn() }),
    useUi: () => ({ setLoginTargetLocation }),
  };
});
vi.mock('@/lib/WalletStorage', () => ({ WalletStorage: storage }));
vi.mock('@/lib/ProtocolAdapterFactory', () => ({
  ProtocolAdapterFactory: { getAdapter: () => ({ hasTokensSupport: true }) },
}));
vi.mock('@/popup/plugins/i18n', () => ({ tg: (key: string) => key }));
vi.mock('@/utils/getPopupProps', () => ({ getPopupProps: vi.fn() }));

const SAVED_PATH = '/more/about';
const mountedPages: HTMLElement[] = [];

/** As Ionic registers a page once it mounted */
function mountPage(route: RouteLocationNormalized) {
  const element = document.createElement('div');
  element.classList.add('ion-page');
  document.body.append(element);
  mountedPages.push(element);
  route.matched.forEach(({ instances }) => Object.assign(instances, { default: { $el: element } }));
}

/** A restart of the app with a page saved a moment ago */
async function openApp({ isLoggedIn }: { isLoggedIn: boolean }) {
  vi.resetModules();
  const { default: router }: { default: Router } = await import('@/popup/router');
  const { useAccounts } = await import('@/composables');
  const accounts = useAccounts();
  accounts.isLoggedIn.value = isLoggedIn;
  const visited: string[] = [];
  router.afterEach((to, _from, failure) => {
    if (failure) return;
    visited.push(to.fullPath);
    mountPage(to);
  });
  await router.push('/');
  return { router, visited, accounts };
}

beforeEach(() => {
  vi.clearAllMocks();
  storage.get.mockReturnValue({ path: SAVED_PATH, time: new Date().toISOString() });
  // The router's scroll behavior; jsdom has none
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

afterEach(() => {
  mountedPages.splice(0).forEach((element) => element.remove());
  vi.restoreAllMocks();
});

describe('the popup router restoring the last page on iOS', () => {
  it('opens the parent, then the saved page, when the wallet opens unlocked', async () => {
    const { router, visited } = await openApp({ isLoggedIn: true });

    await vi.waitFor(() => expect(visited).toEqual(['/more', SAVED_PATH]));
    expect(router.currentRoute.value.fullPath).toBe(SAVED_PATH);
  });

  it('logs in to the saved page, then opens the parent and the saved page', async () => {
    const { router, visited, accounts } = await openApp({ isLoggedIn: false });

    await vi.waitFor(() => expect(visited).toEqual(['/']));
    expect(setLoginTargetLocation).toHaveBeenLastCalledWith(SAVED_PATH);

    // As the login page does
    accounts.isLoggedIn.value = true;
    await router.push(setLoginTargetLocation.mock.lastCall![0]);
    await vi.waitFor(() => expect(visited).toEqual(['/', '/more', SAVED_PATH]));
    expect(router.currentRoute.value.fullPath).toBe(SAVED_PATH);
  });
});
