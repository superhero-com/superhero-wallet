import path from 'path';
import {
  afterAll,
  beforeAll,
  expect,
  it,
} from 'vitest';
import { webkit, type Browser, type Page } from 'playwright-core';
import { createServer, type ViteDevServer } from 'vite';

const ROOT = path.resolve(__dirname, '../..');
const FIXTURE = path.join(ROOT, 'tests/fixtures/route-restoration');
const SAVED_PATH = '/more/about?details=1#version';
let server: ViteDevServer;
let browser: Browser;
let fixtureUrl: string;

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

async function openSavedAbout(page: Page, platform: string, { slowParent = false } = {}) {
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
  expect(await page.evaluate(() => window.routeRestoration.router.currentRoute.value.fullPath))
    .toBe(SAVED_PATH);
  await page.waitForFunction(() => document.querySelector('ion-router-outlet')?.swipeGesture === true);
}

async function startEdgeDrag(page: Page, entering = '#more', leaving = '#about') {
  await page.waitForFunction((selector) => document.querySelector(selector)
    ?.closest('ion-router-outlet')?.swipeGesture === true, leaving);
  // Ionic shares the same gesture recognizer for mouse and touch.
  await page.mouse.move(1, 400);
  await page.mouse.down();
  await page.mouse.move(80, 400, { steps: 8 });
  // The progress animation must initialize before the drag ends.
  await page.waitForSelector(`${entering}:not(.ion-page-hidden)`, { state: 'attached' });
  await page.waitForFunction((selector) => document.querySelector(selector)
    ?.getAnimations({ subtree: true }).some((animation) => animation.playState === 'paused'), leaving);
}

async function launchWithSavedRoute(page: Page, savedRoute: string, options = '') {
  // Seed before the app starts: relaunching a setup page cancels its pending imports.
  await page.addInitScript((savedPath) => localStorage.setItem('route-restoration-test:last-route', JSON.stringify({
    path: savedPath, time: new Date().toISOString(),
  })), savedRoute);
  await page.goto(`${fixtureUrl}?platform=ios${options && `&${options}`}`);
}

it('restores an iOS page with working canceled and completed swipe-back gestures (#3679)', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await openSavedAbout(page, 'ios');
    expect(await page.$eval('ion-router-outlet', (outlet) => outlet.swipeHandler.canStart())).toBe(true);
    expect(await page.locator('#more.ion-page-hidden').count()).toBe(1);

    await startEdgeDrag(page);
    await page.mouse.move(1, 400, { steps: 8 });
    await page.mouse.up();
    await page.waitForSelector('#more.ion-page-hidden', { state: 'attached' });
    expect(await page.evaluate(() => window.routeRestoration.router.currentRoute.value.fullPath))
      .toBe(SAVED_PATH);
    expect(await page.locator('#about:not(.ion-page-hidden)').count()).toBe(1);

    await startEdgeDrag(page);
    await page.mouse.move(370, 400, { steps: 20 });
    await page.mouse.up();
    await page.waitForFunction(() => document.documentElement.dataset.entered === 'more');
    expect(await page.evaluate(() => window.routeRestoration.router.currentRoute.value.path)).toBe('/more');
    expect(await page.locator('#about').count()).toBe(0);
    expect(errors).toEqual([]);
  } finally {
    await page.close();
  }
});

it('retains direct route restoration outside iOS', async () => {
  const page = await browser.newPage();
  try {
    await openSavedAbout(page, 'web');
    expect(await page.locator('#more').count()).toBe(0);
    expect(await page.$eval('ion-router-outlet', (outlet) => outlet.swipeHandler.canStart())).toBe(false);
  } finally {
    await page.close();
  }
});

it('waits for an async inner parent page before restoring the swipe stack', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await openSavedAbout(page, 'ios', { slowParent: true });
    expect(await page.locator('#more.ion-page-hidden').count()).toBe(1);
    expect(await page.$eval('ion-router-outlet', (outlet) => outlet.swipeHandler.canStart())).toBe(true);
    await startEdgeDrag(page);
    await page.mouse.move(370, 400, { steps: 20 });
    await page.mouse.up();
    await page.waitForFunction(() => document.documentElement.dataset.entered === 'more');
    expect(await page.evaluate(() => window.routeRestoration.router.currentRoute.value.path)).toBe('/more');
    expect(errors).toEqual([]);
  } finally {
    await page.close();
  }
});

it('abandons restoration when another navigation starts while its parent is loading', async () => {
  const page = await browser.newPage();
  try {
    await launchWithSavedRoute(page, SAVED_PATH, 'holdParent=true');
    await page.waitForFunction(() => window.routeRestoration.router.currentRoute.value.path === '/more');
    await page.evaluate(() => window.routeRestoration.router.push('/account'));
    await page.waitForFunction(() => document.documentElement.dataset.entered === 'account');
    await page.evaluate(() => window.routeRestoration.releaseParent());
    // A stale restoration would navigate a frame after the parent page mounts.
    await page.waitForSelector('#more', { state: 'attached' });
    await page.evaluate(() => new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
    expect(await page.evaluate(() => window.routeRestoration.router.currentRoute.value.path)).toBe('/account');
    expect(await page.locator('#about').count()).toBe(0);
  } finally {
    await page.close();
  }
});

it('waits for the parent page in nested async Ionic outlets', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await launchWithSavedRoute(page, '/nested/names/auctions');
    await page.waitForFunction(() => document.documentElement.dataset.entered === 'auctions');
    expect(await page.locator('#names.ion-page-hidden').count()).toBe(1);
    expect(await page.$eval('#nested-names > ion-router-outlet', (outlet) => outlet.swipeHandler.canStart()))
      .toBe(true);

    await startEdgeDrag(page, '#names', '#auctions');
    await page.mouse.move(370, 400, { steps: 20 });
    await page.mouse.up();
    await page.waitForFunction(() => document.documentElement.dataset.entered === 'names');
    expect(await page.evaluate(() => window.routeRestoration.router.currentRoute.value.path))
      .toBe('/nested/names');
    expect(errors).toEqual([]);
  } finally {
    await page.close();
  }
});

it('restores a nested URL when an offline parent intentionally omits its child outlet', async () => {
  const page = await browser.newPage();
  try {
    await launchWithSavedRoute(page, '/nested/names/auctions', 'offline=true');
    await page.waitForFunction(() => window.routeRestoration.router.currentRoute.value.path
      === '/nested/names/auctions');
    expect(await page.locator('#nested-names').count()).toBe(1);
    expect(await page.locator('#auctions').count()).toBe(0);
  } finally {
    await page.close();
  }
});

it('retains the saved destination through a locked launch and restores its swipe stack after unlock', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await launchWithSavedRoute(page, SAVED_PATH, 'locked=true');
    await page.waitForFunction(() => document.documentElement.dataset.entered === 'index');
    expect(await page.locator('#about, #more').count()).toBe(0);

    await page.locator('#unlock').click();
    await page.waitForFunction(() => document.documentElement.dataset.entered === 'about');
    expect(await page.evaluate(() => window.routeRestoration.router.currentRoute.value.fullPath))
      .toBe(SAVED_PATH);
    await page.waitForSelector('#more.ion-page-hidden', { state: 'attached' });
    await startEdgeDrag(page);
    await page.mouse.move(370, 400, { steps: 20 });
    await page.mouse.up();
    await page.waitForFunction(() => document.documentElement.dataset.entered === 'more');
    expect(await page.evaluate(() => window.routeRestoration.router.currentRoute.value.path)).toBe('/more');
  } finally {
    await page.close();
  }
});

it.each(['terms', 'privacy'])('restores public %s for locked and authenticated launches', async (name) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const savedPath = `/more/about/${name}?language=en#policy`;
  try {
    await launchWithSavedRoute(page, savedPath, 'locked=true');
    await page.waitForFunction(
      (entered) => document.documentElement.dataset.entered === entered,
      name,
    );
    expect(await page.evaluate(() => window.routeRestoration.router.currentRoute.value.fullPath))
      .toBe(savedPath);
    expect(await page.locator('#index, #about').count()).toBe(0);

    await launchWithSavedRoute(page, savedPath, 'locked=false');
    await page.waitForFunction(
      (entered) => document.documentElement.dataset.entered === entered,
      name,
    );
    expect(await page.evaluate(() => window.routeRestoration.router.currentRoute.value.fullPath))
      .toBe(savedPath);
    await page.waitForSelector('#about.ion-page-hidden', { state: 'attached' });
    await startEdgeDrag(page, '#about', `#${name}`);
    await page.mouse.move(370, 400, { steps: 20 });
    await page.mouse.up();
    await page.waitForFunction(() => document.documentElement.dataset.entered === 'about');
    expect(await page.evaluate(() => window.routeRestoration.router.currentRoute.value.path)).toBe('/more/about');
  } finally {
    await page.close();
  }
});

it.each([
  ['bitcoin', '/coins/bitcoin/details', 'transactions', '/account-details'],
  ['aeternity', '/coins/aeternity', 'assets', '/account-details/assets'],
])(
  'restores %s coin pages after account readiness with the supported swipe-back parent',
  async (protocol, coinPath, parent, parentPath) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const savedPath = `${coinPath}?details=1#symbol`;
    try {
      await launchWithSavedRoute(page, savedPath, `protocol=${protocol}&deferAuth=true`);
      await page.waitForFunction(() => document.documentElement.dataset.authPending === 'true');
      expect(await page.locator('#coin, #assets, #transactions').count()).toBe(0);
      await page.evaluate(() => window.routeRestoration.releaseAuth());
      await page.waitForFunction(() => document.documentElement.dataset.entered === 'coin');
      expect(await page.evaluate(() => window.routeRestoration.router.currentRoute.value.fullPath))
        .toBe(savedPath);
      await page.waitForSelector('#account-root.ion-page-hidden', { state: 'attached' });
      await startEdgeDrag(page, '#account-root', '#coin');
      await page.mouse.move(370, 400, { steps: 20 });
      await page.mouse.up();
      await page.waitForSelector('#coin', { state: 'detached' });
      expect(await page.evaluate(() => window.routeRestoration.router.currentRoute.value.path))
        .toBe(parentPath);
      expect(await page.locator(`#${parent}`).isVisible()).toBe(true);
    } finally {
      await page.close();
    }
  },
);

it('lets navigation during authentication cancel saved-page restoration', async () => {
  const page = await browser.newPage();
  try {
    await launchWithSavedRoute(page, SAVED_PATH, 'deferAuth=true');
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
    expect(await page.evaluate(() => window.routeRestoration.router.currentRoute.value.path)).toBe('/account');
    expect(await page.locator('#about, #more').count()).toBe(0);
  } finally {
    await page.close();
  }
});
