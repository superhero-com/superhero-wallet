/**
 * The last page restored on iOS through the app's router and its own guards.
 * The restoration itself is covered by `RouteLastUsedRoutes.spec.ts`.
 */
import type { RouteLocationNormalized, Router } from 'vue-router';

const { storage, setLoginTargetLocation, auth } = vi.hoisted(() => ({
  storage: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
  setLoginTargetLocation: vi.fn(),
  /** Resolves `checkUserAuth`, none to resolve it at once */
  auth: { gate: undefined as Promise<void> | undefined, checks: [] as string[] },
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
      { path: '/account-details', name: 'account-details', component: Page },
      {
        path: '/account-details/assets',
        name: 'account-details-assets',
        component: Page,
        meta: { redirectIfNull: 'account-details' },
      },
      {
        path: '/coins/bitcoin/details',
        name: 'coin-details',
        component: Page,
        meta: { backRoute: { name: 'account-details-assets' } },
      },
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
    useAuth: () => ({
      checkUserAuth: async () => {
        auth.checks.push('checked');
        await auth.gate;
      },
      isAuthenticated: ref(true),
    }),
    usePopupProps: () => ({ setPopupProps: vi.fn() }),
    useUi: () => ({ setLoginTargetLocation }),
  };
});
vi.mock('@/lib/WalletStorage', () => ({ WalletStorage: storage }));
vi.mock('@/lib/ProtocolAdapterFactory', () => ({
  ProtocolAdapterFactory: {
    getAdapter: (protocol: string) => ({ hasTokensSupport: protocol === 'aeternity' }),
  },
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
async function openApp({ isLoggedIn, areAccountsReady = true }: {
  isLoggedIn: boolean;
  areAccountsReady?: boolean;
}) {
  vi.resetModules();
  const { default: router }: { default: Router } = await import('@/popup/router');
  const { useAccounts } = await import('@/composables');
  const accounts = useAccounts();
  accounts.isLoggedIn.value = isLoggedIn;
  accounts.areAccountsReady.value = areAccountsReady;
  const visited: string[] = [];
  router.afterEach((to, _from, failure) => {
    if (failure) return;
    visited.push(to.fullPath);
    mountPage(to);
  });
  const opening = router.push('/');
  if (areAccountsReady && !auth.gate) await opening;
  return {
    router, visited, accounts, opening,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.gate = undefined;
  auth.checks = [];
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

  it('picks the parent of a coin page by the account the wallet has once it is ready', async () => {
    const coinPath = '/coins/bitcoin/details';
    storage.get.mockReturnValue({ path: coinPath, time: new Date().toISOString() });
    const { router, visited, accounts } = await openApp({
      isLoggedIn: true,
      areAccountsReady: false,
    });
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    expect(visited).toEqual([]);

    // The account had another protocol before, which has tokens
    accounts.activeAccount.value = { protocol: 'bitcoin' };
    accounts.areAccountsReady.value = true;

    await vi.waitFor(() => expect(visited).toEqual(['/account-details', coinPath]));
    expect(router.currentRoute.value.fullPath).toBe(coinPath);
  });

  it('opens the page the user went to while the wallet checked the login, not the saved one', async () => {
    let unlock: () => void;
    auth.gate = new Promise((resolve) => { unlock = resolve; });
    const { router, visited, opening } = await openApp({ isLoggedIn: true });
    // On the way to the saved page
    await vi.waitFor(() => expect(auth.checks).toHaveLength(1));

    const going = router.push('/account');
    await vi.waitFor(() => expect(auth.checks).toHaveLength(2));
    unlock!();
    await Promise.allSettled([opening, going]);
    await new Promise((resolve) => { setTimeout(resolve, 0); });

    expect(router.currentRoute.value.fullPath).toBe('/account');
    expect(visited).toEqual(['/account']);
  });
});
