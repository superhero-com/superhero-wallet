import type { Router } from 'vue-router';

import { APP_LINK_WEB } from '@/constants';

/**
 * The mobile app gets every link it is opened with as an `appUrlOpen` event:
 * its own `superhero:` scheme, universal links of the web wallet and pairing
 * links. docs/deep-link-schema.md documents the routes these links open. They
 * run here through the app's router with its real routes and guards; only the
 * native `App` plugin, the wallet state the guards read and WalletConnect are
 * stood in for.
 */

const {
  appListeners,
  wallet,
  walletConnect,
  setLoginTargetLocation,
} = vi.hoisted(() => ({
  appListeners: {} as Record<string, (event: { url: string }) => void>,
  wallet: { isLoggedIn: true, isAuthenticated: true },
  walletConnect: {
    connect: vi.fn(async () => {}),
    setIsOpenUsingDeeplink: vi.fn(),
    hasSession: false,
  },
  setLoginTargetLocation: vi.fn(),
}));

vi.mock('@/constants', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/constants')>(),
  IS_MOBILE_APP: true,
  IS_IOS: false,
  IS_WEB: false,
  RUNNING_IN_POPUP: false,
}));
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (name: string, listener: (event: { url: string }) => void) => {
      appListeners[name] = listener;
    },
    exitApp: vi.fn(),
  },
}));
// Ionic's router needs its outlet; the memory history is the same router underneath
vi.mock('@ionic/vue-router', async () => {
  const { createRouter, createMemoryHistory } = await import('vue-router');
  return {
    createRouter,
    createWebHashHistory: createMemoryHistory,
    createWebHistory: createMemoryHistory,
  };
});
/** Read as the router reads them: at the moment it needs them */
const current = <T>(read: () => T) => ({ get value() { return read(); } });
vi.mock('@/composables', async (importOriginal) => {
  const { ref } = await import('vue');
  return {
    ...await importOriginal<typeof import('@/composables')>(),
    useAccounts: () => ({
      activeAccount: ref({ protocol: 'aeternity', address: 'ak_test' }),
      isLoggedIn: current(() => wallet.isLoggedIn),
      areAccountsReady: ref(true),
    }),
    useAuth: () => ({
      checkUserAuth: async () => {},
      isAuthenticated: current(() => wallet.isAuthenticated),
    }),
    usePopupProps: () => ({ setPopupProps: vi.fn() }),
    useUi: () => ({ setLoginTargetLocation }),
    useWalletConnect: () => ({
      connect: walletConnect.connect,
      setIsOpenUsingDeeplink: walletConnect.setIsOpenUsingDeeplink,
      wcSession: current(() => (walletConnect.hasSession ? { topic: 'open-session' } : null)),
    }),
  };
});

/**
 * A deep link as docs/deep-link-schema.md tells a dapp to build one. The `%26`
 * is data: decoded twice, it would turn into a `&`.
 */
const SIGN_MESSAGE_QUERY = {
  message: 'Log in: n0nce & 100%26 more',
  'x-success': 'https://dapp.example/cb?signature={signature}&address={address}',
  'x-cancel': 'https://dapp.example/cb?cancelled=true',
};
const query = new URLSearchParams(SIGN_MESSAGE_QUERY).toString();
const PAIRING_URI = 'wc:7f6e504bfad60b485450578e05678ed3e8e8c4751d3c6160be17160d63ec90f9@2?relay-protocol=irn&symKey=587d5484ce2a2a6ee3ba1962fdd7e8588e06200c46823bd18fbd67def96ad303';

let router: Router;

/** Opening a page loads it first, which takes a while on a busy CI runner */
const WAIT = { timeout: 5000 };

/** The app as the user opens it: unlocked, on its account screen */
async function openApp() {
  // The previous test's listener, which the wait below would otherwise accept
  delete appListeners.appUrlOpen;
  vi.resetModules();
  ({ default: router } = await import('@/popup/router'));
  await router.push('/');
  document.dispatchEvent(new Event('deviceready'));
  await vi.waitFor(() => expect(appListeners.appUrlOpen).toBeTypeOf('function'), WAIT);
}

async function openLink(url: string) {
  appListeners.appUrlOpen({ url });
  await vi.waitFor(() => expect(router.currentRoute.value.path).not.toBe('/account'), WAIT);
  return router.currentRoute.value;
}

beforeEach(async () => {
  vi.clearAllMocks();
  wallet.isLoggedIn = true;
  wallet.isAuthenticated = true;
  walletConnect.hasSession = false;
  // The router's scroll behavior; jsdom has none
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  await openApp();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('a link the mobile app is opened with', () => {
  it.each([
    ['its own scheme', `superhero://sign-message?${query}`],
    ['its own scheme without a host', `superhero:/sign-message?${query}`],
    ['a universal link', `${APP_LINK_WEB}/sign-message?${query}`],
  ])('opens the page of %s with the query the dapp sent', async (_, url) => {
    const route = await openLink(url);

    expect(route.name).toBe('sign-message');
    // The callback templates arrive as the dapp encoded them, placeholders intact
    expect(route.query).toEqual(SIGN_MESSAGE_QUERY);
  });

  it.each(['address', 'sign-transaction', 'sign-jwt'])(
    'opens the %s page it names',
    async (page) => {
      expect((await openLink(`superhero://${page}?${query}`)).name).toBe(page);
    },
  );

  it.each([
    ['another site', `https://dapp.example/sign-message?${query}`],
    ['a host that only starts like the wallet', `${APP_LINK_WEB}.evil.example/sign-message?${query}`],
    ['the wallet over http', `${APP_LINK_WEB.replace('https:', 'http:')}/sign-message?${query}`],
  ])('is refused when it is a link of %s', (_, url) => {
    const push = vi.spyOn(router, 'push');

    expect(() => appListeners.appUrlOpen({ url })).toThrow(/Unknown url/);
    expect(push).not.toHaveBeenCalled();
  });

  it('is kept for after the login when the wallet is logged out', async () => {
    wallet.isLoggedIn = false;

    await openLink(`superhero://sign-message?${query}`);

    expect(router.currentRoute.value.name).toBe('index');
    expect(setLoginTargetLocation).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      name: 'sign-message',
      query: SIGN_MESSAGE_QUERY,
    }));
  });
});

describe('a WalletConnect pairing link the mobile app is opened with', () => {
  const pairingLink = `superhero://wc?uri=${encodeURIComponent(PAIRING_URI)}`;

  it('pairs with the dapp on the account screen, asking the user to confirm the session', async () => {
    await router.push('/sign-message');

    appListeners.appUrlOpen({ url: pairingLink });

    await vi.waitFor(() => expect(walletConnect.connect)
      .toHaveBeenCalledExactlyOnceWith(PAIRING_URI, true), WAIT);
    expect(router.currentRoute.value.name).toBe('account');
  });

  it('pairs through the universal link as well', async () => {
    appListeners.appUrlOpen({ url: `${APP_LINK_WEB}/wc?uri=${encodeURIComponent(PAIRING_URI)}` });

    await vi.waitFor(() => expect(walletConnect.connect)
      .toHaveBeenCalledExactlyOnceWith(PAIRING_URI, true), WAIT);
  });

  /**
   * Fails today: Android opens the app with plain `wc:` links, but
   * `new URL('wc:…').origin` is "null", and the URI is the link itself,
   * not a `uri` parameter.
   */
  it.fails('pairs through a plain wc: link', async () => {
    appListeners.appUrlOpen({ url: PAIRING_URI });

    await vi.waitFor(() => expect(walletConnect.connect)
      .toHaveBeenCalledExactlyOnceWith(PAIRING_URI, true), WAIT);
  });

  it.each([
    ['the wallet is locked', () => { wallet.isAuthenticated = false; }],
    ['a session is open', () => { walletConnect.hasSession = true; }],
  ])('does not pair while %s', async (_, arrange) => {
    arrange();

    appListeners.appUrlOpen({ url: pairingLink });

    await vi.waitFor(() => expect(walletConnect.setIsOpenUsingDeeplink)
      .toHaveBeenLastCalledWith(false), WAIT);
    expect(walletConnect.connect).not.toHaveBeenCalled();
  });

  it('does not pair a link without a pairing URI', async () => {
    appListeners.appUrlOpen({ url: 'superhero://wc' });

    await vi.waitFor(() => expect(walletConnect.setIsOpenUsingDeeplink)
      .toHaveBeenLastCalledWith(false), WAIT);
    expect(walletConnect.connect).not.toHaveBeenCalled();
  });
});
