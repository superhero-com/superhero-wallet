import path from 'path';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
} from 'vitest';
import { webkit, type Browser, type Page } from 'playwright-core';
import { createServer, type ViteDevServer } from 'vite';
import { startEdgeDrag, swipeBack } from './swipe';

const ROOT = path.resolve(__dirname, '../..');
const FIXTURE = path.join(ROOT, 'tests/fixtures/route-restoration');
const SAVED_PATH = '/more/about?details=1#version';
const LAST_ROUTE_KEY = 'route-restoration-test:last-route';
let server: ViteDevServer;
let browser: Browser;
let fixtureUrl: string;
let page: Page;
let pageErrors: string[];

beforeAll(async () => {
  server = await createServer({
    configFile: false,
    root: ROOT,
    cacheDir: path.join(ROOT, 'node_modules/.vite-route-restoration'),
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    resolve: {
      alias: [
        { find: '@/constants', replacement: path.join(FIXTURE, 'constants.ts') },
        { find: '@/utils', replacement: path.join(FIXTURE, 'utils.ts') },
        { find: './WalletStorage', replacement: path.join(FIXTURE, 'storage.ts') },
        { find: '@', replacement: path.join(ROOT, 'src') },
      ],
    },
    optimizeDeps: { entries: ['tests/fixtures/route-restoration/index.html'] },
    server: { port: 0 },
    logLevel: 'error',
  });
  await server.listen();
  fixtureUrl = `${server.resolvedUrls!.local[0]}tests/fixtures/route-restoration/index.html`;
  browser = await webkit.launch();
});

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

beforeEach(async () => {
  page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
});

afterEach(async () => {
  await page.close();
  expect(pageErrors).toEqual([]);
});

async function getCurrentPath(key: 'path' | 'fullPath' = 'path') {
  return page.evaluate(
    (routeKey) => window.routeRestoration.router.currentRoute.value[routeKey],
    key,
  );
}

async function openSavedAbout(platform: string, { slowParent = false } = {}) {
  const url = `${fixtureUrl}?platform=${platform}&slowParent=${slowParent}`;
  await page.goto(url);
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'account');
  await page.evaluate(() => window.routeRestoration.router.push('/more'));
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'more');
  await page.evaluate((savedPath) => window.routeRestoration.router.push(savedPath), SAVED_PATH);
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'about');

  // Relaunch without Ionic history to reproduce a cold app start.
  await page.goto(url);
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'about');
  expect(await getCurrentPath('fullPath')).toBe(SAVED_PATH);
  await page.waitForFunction(() => document.querySelector('ion-router-outlet')?.swipeGesture === true);
  return url;
}

async function launchWithSavedRoute(savedRoute: string, options = '') {
  // Seed before the app starts: relaunching a setup page cancels its pending imports.
  await page.addInitScript(({ key, savedPath }) => localStorage.setItem(key, JSON.stringify({
    path: savedPath, time: new Date().toISOString(),
  })), { key: LAST_ROUTE_KEY, savedPath: savedRoute });
  await page.goto(`${fixtureUrl}?platform=ios${options && `&${options}`}`);
}

it('restores an iOS page with working canceled and completed swipe-back gestures (#3679)', async () => {
  await openSavedAbout('ios');
  expect(await page.$eval('ion-router-outlet', (outlet) => outlet.swipeHandler.canStart())).toBe(true);
  expect(await page.locator('#more.ion-page-hidden').count()).toBe(1);

  await startEdgeDrag(page, '#more', '#about');
  await page.mouse.move(1, 400, { steps: 8 });
  await page.mouse.up();
  await page.waitForSelector('#more.ion-page-hidden', { state: 'attached' });
  expect(await getCurrentPath('fullPath')).toBe(SAVED_PATH);
  expect(await page.locator('#about:not(.ion-page-hidden)').count()).toBe(1);

  await swipeBack(page, '#more', '#about');
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'more');
  expect(await getCurrentPath()).toBe('/more');
  expect(await page.locator('#about').count()).toBe(0);
});

it('saves the parent reached by a swipe back and restores it on the next launch', async () => {
  const url = await openSavedAbout('ios');
  await swipeBack(page, '#more', '#about');
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'more');
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).path, LAST_ROUTE_KEY))
    .toBe('/more');

  await page.goto(url);
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'more');
  expect(await getCurrentPath('fullPath')).toBe('/more');
  await page.waitForSelector('#account.ion-page-hidden', { state: 'attached' });
  await swipeBack(page, '#account', '#more');
  expect(await getCurrentPath()).toBe('/account');
});

it('retains direct route restoration outside iOS', async () => {
  await openSavedAbout('web');
  expect(await page.locator('#more').count()).toBe(0);
  expect(await page.$eval('ion-router-outlet', (outlet) => outlet.swipeHandler.canStart())).toBe(false);
});

it('waits for an async inner parent page before restoring the swipe stack', async () => {
  await openSavedAbout('ios', { slowParent: true });
  expect(await page.locator('#more.ion-page-hidden').count()).toBe(1);
  expect(await page.$eval('ion-router-outlet', (outlet) => outlet.swipeHandler.canStart())).toBe(true);
  await swipeBack(page, '#more', '#about');
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'more');
  expect(await getCurrentPath()).toBe('/more');
});

it('abandons restoration when another navigation starts while its parent is loading', async () => {
  await launchWithSavedRoute(SAVED_PATH, 'holdParent=true');
  await page.waitForFunction(() => window.routeRestoration.router.currentRoute.value.path === '/more');
  await page.evaluate(() => window.routeRestoration.router.push('/account'));
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'account');
  await page.evaluate(() => window.routeRestoration.releaseParent());
  // A stale restoration would navigate a frame after the parent page mounts.
  await page.waitForSelector('#more', { state: 'attached' });
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
  expect(await getCurrentPath()).toBe('/account');
  expect(await page.locator('#about').count()).toBe(0);
});

it('waits for the parent page in nested async Ionic outlets', async () => {
  await launchWithSavedRoute('/nested/names/auctions');
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'auctions');
  expect(await page.locator('#names.ion-page-hidden').count()).toBe(1);
  expect(await page.$eval('#nested-names > ion-router-outlet', (outlet) => outlet.swipeHandler.canStart()))
    .toBe(true);

  await swipeBack(page, '#names', '#auctions');
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'names');
  expect(await getCurrentPath()).toBe('/nested/names');
});

it('restores a nested URL when an offline parent intentionally omits its child outlet', async () => {
  await launchWithSavedRoute('/nested/names/auctions', 'offline=true');
  await page.waitForFunction(() => window.routeRestoration.router.currentRoute.value.path
    === '/nested/names/auctions');
  expect(await page.locator('#nested-names').count()).toBe(1);
  expect(await page.locator('#auctions').count()).toBe(0);
});

it('retains the saved destination through a locked launch and restores its swipe stack after unlock', async () => {
  await launchWithSavedRoute(SAVED_PATH, 'locked=true');
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'index');
  expect(await page.locator('#about, #more').count()).toBe(0);

  await page.locator('#unlock').click();
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'about');
  expect(await getCurrentPath('fullPath')).toBe(SAVED_PATH);
  await page.waitForSelector('#more.ion-page-hidden', { state: 'attached' });
  await swipeBack(page, '#more', '#about');
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'more');
  expect(await getCurrentPath()).toBe('/more');
});

it('restores a public page for locked and authenticated launches', async () => {
  const savedPath = '/more/about/terms?language=en#policy';
  await launchWithSavedRoute(savedPath, 'locked=true');
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'terms');
  expect(await getCurrentPath('fullPath')).toBe(savedPath);
  expect(await page.locator('#index, #about').count()).toBe(0);

  await launchWithSavedRoute(savedPath, 'locked=false');
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'terms');
  expect(await getCurrentPath('fullPath')).toBe(savedPath);
  await page.waitForSelector('#about.ion-page-hidden', { state: 'attached' });
  await swipeBack(page, '#about', '#terms');
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'about');
  expect(await getCurrentPath()).toBe('/more/about');
});

it.each([
  ['bitcoin', '/coins/bitcoin/details', 'transactions', '/account-details'],
  ['aeternity', '/coins/aeternity', 'assets', '/account-details/assets'],
])(
  'restores %s coin pages after account readiness with the supported swipe-back parent',
  async (protocol, coinPath, parent, parentPath) => {
    const savedPath = `${coinPath}?details=1#symbol`;
    await launchWithSavedRoute(savedPath, `protocol=${protocol}&deferAuth=true`);
    await page.waitForFunction(() => document.documentElement.dataset.authPending === 'true');
    expect(await page.locator('#coin, #assets, #transactions').count()).toBe(0);
    await page.evaluate(() => window.routeRestoration.releaseAuth());
    await page.waitForFunction(() => document.documentElement.dataset.entered === 'coin');
    expect(await getCurrentPath('fullPath')).toBe(savedPath);
    await page.waitForSelector('#account-root.ion-page-hidden', { state: 'attached' });
    await swipeBack(page, '#account-root', '#coin');
    expect(await getCurrentPath()).toBe(parentPath);
    expect(await page.locator(`#${parent}`).isVisible()).toBe(true);
  },
);

it('lets navigation during authentication cancel saved-page restoration', async () => {
  await launchWithSavedRoute(SAVED_PATH, 'deferAuth=true');
  await page.waitForFunction(() => document.documentElement.dataset.authPending === 'true');
  await page.evaluate(() => {
    document.documentElement.dataset.authPending = 'false';
    window.routeRestoration.router.push('/account');
  });
  // vue-router follows redirects even from superseded navigations, so finish authentication
  // only once the newer navigation has reached it, as a user's tap would have.
  await page.waitForFunction(() => document.documentElement.dataset.authPending === 'true');
  await page.evaluate(() => window.routeRestoration.releaseAuth());
  await page.waitForFunction(() => document.documentElement.dataset.entered === 'account');
  expect(await getCurrentPath()).toBe('/account');
  expect(await page.locator('#about, #more').count()).toBe(0);
});
