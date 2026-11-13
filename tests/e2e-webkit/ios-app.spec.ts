import path from 'path';
import {
  afterAll,
  beforeAll,
  expect,
  it,
} from 'vitest';
import {
  devices,
  webkit,
  type Browser,
  type Page,
} from 'playwright-core';
import { createServer, type ViteDevServer } from 'vite';
import { LOCAL_STORAGE_PREFIX, NETWORK_NAME_TESTNET, STORAGE_KEYS } from '../../src/constants/common';
import locale from '../../src/popup/locales/en-US.json';
import { swipeBack } from './swipe';

const ROOT = path.resolve(__dirname, '../..');
const NETWORK_KEY = [LOCAL_STORAGE_PREFIX, STORAGE_KEYS.activeNetworkName].join('_');

const OUTLET = '.app-inner > ion-router-outlet';
/** A page of the app's outlet, found by what it shows. */
const pageWith = (content: string) => `${OUTLET} > .ion-page:has(${content})`;
const MORE = pageWith('[data-cy=about]');
const ABOUT = pageWith('.icon-github');
const ACCOUNT_DETAILS = pageWith('[data-cy=account-details-assets]');
const COIN = pageWith('.token-container');
/** The launch splash is black. */
const SPLASH_COLOR = '#000000';

let server: ViteDevServer;
let browser: Browser;
let appUrl: string;

beforeAll(async () => {
  // The iOS app's build. RUNNING_IN_TESTS would turn off the page animations swipe-back needs.
  Object.assign(process.env, { PLATFORM: 'ionic', RUNNING_IN_TESTS: 'false' });
  server = await createServer({
    root: ROOT,
    configFile: path.join(ROOT, 'vite.config.mts'),
    mode: 'development',
    cacheDir: path.join(ROOT, 'node_modules/.vite-e2e-webkit-ios'),
    resolve: {
      // Native plugins the app uses at startup that need a stand-in on the web
      alias: [
        { find: /^@capacitor\/status-bar$/, replacement: path.join(__dirname, 'stubs/status-bar.ts') },
        { find: /^@capacitor\/splash-screen$/, replacement: path.join(__dirname, 'stubs/splash-screen.ts') },
        { find: /^@capacitor\/filesystem$/, replacement: path.join(__dirname, 'stubs/filesystem.ts') },
        {
          find: /^@aparajita\/capacitor-biometric-auth$/,
          replacement: path.join(__dirname, 'stubs/biometric-auth.ts'),
        },
      ],
    },
    server: { port: 0 },
    logLevel: 'error',
  });
  await server.listen();
  [appUrl] = server.resolvedUrls!.local;
  browser = await webkit.launch();
});

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

/** Opens a new install, on an iPhone with or without Face ID. */
async function install({ hasFaceId }: { hasFaceId: boolean }) {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  await context.addInitScript(({ faceId, key, network }) => {
    Object.assign(window, { hasFaceId: faceId });
    // On testnet, as the other e2e tests
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(network));
  }, { faceId: hasFaceId, key: NETWORK_KEY, network: NETWORK_NAME_TESTNET });
  const page = await context.newPage();
  const faceIdPrompts: string[] = [];
  page.on('dialog', (dialog) => {
    faceIdPrompts.push(dialog.message());
    dialog.accept();
  });

  await page.goto(appUrl);
  return { context, page, faceIdPrompts };
}

/** Creates a wallet on a new install, on an iPhone with or without Face ID. */
async function createWallet({ hasFaceId }: { hasFaceId: boolean }) {
  const app = await install({ hasFaceId });
  const { page } = app;
  await page.click('[data-cy=checkbox]');
  await page.click('[data-cy=generate-wallet]');
  await page.click('[data-cy=btn-add-aeternity]');
  if (hasFaceId) {
    await page.getByText(locale.pages.secureLogin.enableSecureLogin, { exact: true }).click();
  }
  await page.waitForSelector('[data-cy=balance-info]');
  return app;
}

/** Opens the app again as iOS does after closing it: at its start, without page history. */
async function relaunch(page: Page) {
  await page.goto(appUrl);
}

const getRoute = (page: Page) => page.evaluate(() => window.location.hash);

type StubbedWindow = typeof window & { statusBarColors?: string[]; hideSplash: () => void };

/** The status bar colors the app has set since it was opened */
const getStatusBarColors = (page: Page) => page.evaluate(
  () => (window as StubbedWindow).statusBarColors ?? [],
);

const getStatusBarColor = async (page: Page) => (await getStatusBarColors(page)).at(-1);

/** Lets the native splash finish hiding, once the app has asked to hide it. */
async function hideSplash(page: Page) {
  await page.waitForFunction(() => 'hideSplash' in window);
  await page.evaluate(() => (window as StubbedWindow).hideSplash());
}

// #3679: the restored page had no page behind it to swipe back to
it('reopens the last page with its parent behind it, to swipe back to', async () => {
  const { context, page } = await createWallet({ hasFaceId: false });
  try {
    await page.click('[data-cy=page-more]');
    await page.click('[data-cy=about]');
    await page.waitForSelector(ABOUT);

    await relaunch(page);
    await page.waitForSelector(`${ABOUT}:not(.ion-page-hidden)`);
    await page.waitForSelector(`${MORE}.ion-page-hidden`, { state: 'attached' });
    expect(await getRoute(page)).toBe('#/more/about');

    await swipeBack(page, MORE, ABOUT);
    expect(await getRoute(page)).toBe('#/more');
  } finally {
    await context.close();
  }
});

it('asks for Face ID once and reopens a coin page with the assets behind it', async () => {
  const { context, page, faceIdPrompts } = await createWallet({ hasFaceId: true });
  try {
    await page.click('[data-cy=account-card-base]');
    await page.click('[data-cy=account-details-assets]');
    await page.click('a[href="#/coins/aeternity"]');
    await page.waitForSelector(COIN);
    const promptCount = faceIdPrompts.length;

    await relaunch(page);
    await page.waitForSelector(`${COIN}:not(.ion-page-hidden)`);
    await page.waitForSelector(`${ACCOUNT_DETAILS}.ion-page-hidden`, { state: 'attached' });
    expect(faceIdPrompts).toHaveLength(promptCount + 1);
    expect(await getRoute(page)).toBe('#/coins/aeternity');

    await swipeBack(page, ACCOUNT_DETAILS, COIN);
    expect(await getRoute(page)).toBe('#/account-details/assets');
  } finally {
    await context.close();
  }
});

// #3673: the status bar turned grey over the black splash
it('keeps the status bar black like the splash until the splash hides', async () => {
  const { context, page } = await install({ hasFaceId: false });
  try {
    await page.waitForSelector('[data-cy=checkbox]');
    expect(new Set(await getStatusBarColors(page))).toEqual(new Set([SPLASH_COLOR]));

    await hideSplash(page);
    await expect.poll(() => getStatusBarColor(page)).toBe('#141414');
  } finally {
    await context.close();
  }
});

// #3673: a reload, like after a wallet reset, shows no splash
it('keeps the page color on the status bar after a reload', async () => {
  const { context, page } = await install({ hasFaceId: false });
  try {
    await hideSplash(page);
    await expect.poll(() => getStatusBarColor(page)).toBe('#141414');

    await page.reload();
    await page.waitForSelector('[data-cy=checkbox]');
    expect(await getStatusBarColors(page)).toEqual(['#141414']);
  } finally {
    await context.close();
  }
});

it('gives the status bar the color of a page reopened behind the splash once it hides', async () => {
  const { context, page } = await createWallet({ hasFaceId: false });
  try {
    await page.click('[data-cy=account-card-base]');
    await page.waitForSelector(ACCOUNT_DETAILS);

    await relaunch(page);
    await page.waitForSelector(`${ACCOUNT_DETAILS}:not(.ion-page-hidden)`);
    expect(new Set(await getStatusBarColors(page))).toEqual(new Set([SPLASH_COLOR]));

    await hideSplash(page);
    await expect.poll(() => getStatusBarColor(page)).toBe('#191919');
  } finally {
    await context.close();
  }
});
