import path from 'path';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import { webkit, type Browser, type Page } from 'playwright-core';
import { createServer, type ViteDevServer } from 'vite';
import vue from '@vitejs/plugin-vue';

interface AnimationRecord {
  pageId: string;
  keyframes: ComputedKeyframe[];
  duration: number;
}

declare global {
  interface Window {
    pageTransitionAnimations: AnimationRecord[];
  }
}

const ROOT = path.resolve(__dirname, '../..');
const FIXTURE = path.join(ROOT, 'tests/fixtures/page-transitions');
const PLATFORMS = [
  { name: 'non-iOS', query: 'platform=web', animation: 'fade' },
  { name: 'iOS', query: 'platform=ios', animation: 'slide' },
  { name: 'Firefox', query: 'platform=web&firefox=true', animation: 'none' },
  { name: 'test mode', query: 'platform=web&runningInTests=true', animation: 'none' },
];
const OUTLETS = [
  {
    name: 'App',
    first: 'account',
    second: 'more',
    path: '/account',
    nextPath: '/more',
    forward: '#open-more',
  },
  {
    name: 'DefaultPagesRouter',
    first: 'multisig',
    second: 'multisig-details',
    path: '/multisig',
    nextPath: '/multisig/details',
    forward: '#open-multisig-details',
  },
];
let server: ViteDevServer;
let browser: Browser;
let fixtureUrl: string;

beforeAll(async () => {
  server = await createServer({
    configFile: false,
    root: ROOT,
    cacheDir: path.join(ROOT, 'node_modules/.vite-page-transitions'),
    plugins: [vue()],
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
      browser: '{}',
    },
    resolve: {
      dedupe: ['vue', 'vue-router'],
      alias: [
        { find: /^@\/constants$/, replacement: path.join(FIXTURE, 'constants.ts') },
        { find: /^@\/composables(?:\/transferSendHandler)?$/, replacement: path.join(FIXTURE, 'composables.ts') },
        { find: /^@\/protocols\/aeternity\/composables\/aeNames$/, replacement: path.join(FIXTURE, 'composables.ts') },
        { find: /^@\/utils$/, replacement: path.join(FIXTURE, 'utils.ts') },
        { find: /^@\/popup\/components\/(ConnectionStatus|Loader|QrCodeReaderMobileOverlay)\.vue$/, replacement: path.join(FIXTURE, 'component.ts') },
        { find: '@', replacement: path.join(ROOT, 'src') },
      ],
    },
    optimizeDeps: { entries: ['tests/fixtures/page-transitions/index.html'] },
    server: { port: 0 },
    logLevel: 'error',
  });
  await server.listen();
  fixtureUrl = `${server.resolvedUrls!.local[0]}tests/fixtures/page-transitions/index.html`;
  browser = await webkit.launch();
});

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

async function expectEnteredPage(page: Page, id: string) {
  await page.waitForFunction((pageId) => {
    if (document.documentElement.dataset.entered !== pageId) return false;
    let element: Element | null = document.getElementById(pageId);
    if (!element) return false;
    while (element) {
      if (element.classList.contains('ion-page-hidden')
        || element.classList.contains('ion-page-invisible')) return false;
      element = element.parentElement;
    }
    return true;
  }, id);
  expect(await page.locator(`#${id}`).isVisible()).toBe(true);
  expect(await page.$eval(`#${id}`, (element) => ({
    opacity: getComputedStyle(element).opacity,
    pointerEvents: (element as HTMLElement).style.pointerEvents,
    contentTransform: getComputedStyle(element.querySelector('ion-content')!).transform,
    animations: element.getAnimations({ subtree: true }).length,
  }))).toEqual({
    opacity: '1', pointerEvents: '', contentTransform: 'none', animations: 0,
  });
}

async function expectAnimation(page: Page, kind: string, entering: string, leaving: string) {
  const records = await page.evaluate(() => window.pageTransitionAnimations);
  const routeRecords = records.filter(({ pageId }) => pageId === entering || pageId === leaving);
  if (kind === 'none') {
    expect(routeRecords).toEqual([]);
  } else if (kind === 'slide') {
    [entering, leaving].forEach((id) => {
      expect(routeRecords.some(({ pageId, keyframes }) => pageId === id
        && keyframes.some(({ transform }) => typeof transform === 'string'
          && transform.includes('translateX')))).toBe(true);
    });
  } else {
    expect(routeRecords).toHaveLength(2);
    expect(routeRecords.map(({ duration }) => duration)).toEqual([100, 100]);
    expect(routeRecords.every(({ keyframes }) => keyframes.every(({ transform }) => !transform)))
      .toBe(true);
    expect(routeRecords.find(({ pageId }) => pageId === entering)
      ?.keyframes.map(({ opacity }) => Number(opacity))).toEqual([0, 1]);
    expect(routeRecords.find(({ pageId }) => pageId === leaving)
      ?.keyframes.map(({ opacity }) => Number(opacity))).toEqual([1, 0]);
  }
}

describe.each(PLATFORMS)('$name page transitions', ({ query, animation }) => {
  it.each(OUTLETS)('$name outlet preserves forward/back navigation and cleans up pages', async ({
    first, second, path: initialPath, nextPath, forward,
  }) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      // Observe native animations without racing the 100 ms transition or replacing playback.
      await page.addInitScript(() => {
        window.pageTransitionAnimations = [];
        const { animate } = Element.prototype;
        Element.prototype.animate = function recordAnimation(keyframes, options) {
          const result = animate.call(this, keyframes, options);
          const effect = result.effect as KeyframeEffect;
          window.pageTransitionAnimations.push({
            pageId: this.closest('.ion-page')?.id || '',
            keyframes: effect.getKeyframes(),
            duration: Number(effect.getTiming().duration),
          });
          return result;
        };
      });
      await page.goto(`${fixtureUrl}?${query}#${initialPath}`);
      await expectEnteredPage(page, first);

      await page.evaluate(() => { window.pageTransitionAnimations = []; });
      await page.locator(forward).click();
      await expectEnteredPage(page, second);
      await page.waitForSelector(`#${first}.ion-page-hidden`, { state: 'attached' });
      expect(await page.locator(`#${first}`).isVisible()).toBe(false);
      expect(await page.locator(`#${first}`).getAttribute('aria-hidden')).toBe('true');
      expect(new URL(page.url()).hash).toBe(`#${nextPath}`);
      await expectAnimation(page, animation, second, first);

      await page.evaluate(() => { window.pageTransitionAnimations = []; });
      await page.locator(`#${second} #back`).click();
      await expectEnteredPage(page, first);
      await page.waitForSelector(`#${second}`, { state: 'detached' });
      expect(new URL(page.url()).hash).toBe(`#${initialPath}`);
      await expectAnimation(page, animation, first, second);
      expect(errors).toEqual([]);
    } finally {
      await page.close();
    }
  });
});
