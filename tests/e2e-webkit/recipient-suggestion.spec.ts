import path from 'path';
import {
  afterAll,
  beforeAll,
  expect,
  it,
} from 'vitest';
import { devices, webkit, type Browser } from 'playwright-core';
import { createServer, type ViteDevServer } from 'vite';
import type { IAddressBookEntry } from '../../src/types';
import { TEST_ACCOUNT } from '../fixtures/account';
import { seedWallet } from './fixtures/seed-wallet';

const ROOT = path.resolve(__dirname, '../..');
const CONTACT: IAddressBookEntry = {
  name: 'Saved contact',
  address: 'ak_wMHNCzQJ4HUL3TZ1fi6nQsHg6TjmHLs1bPXSp8iQ1VmxGNAZ4',
  isBookmarked: false,
  protocol: 'aeternity',
};

let server: ViteDevServer;
let browser: Browser;
let appUrl: string;

beforeAll(async () => {
  // Read by vite.config.mts, as with `npm run test:e2e`
  Object.assign(process.env, { PLATFORM: 'web', RUNNING_IN_TESTS: 'true' });
  server = await createServer({
    root: ROOT,
    configFile: path.join(ROOT, 'vite.config.mts'),
    mode: 'development',
    // Its own, as in the other specs. Vite resolves polyfill shims from this folder.
    cacheDir: path.join(ROOT, 'node_modules/.vite-e2e-webkit-recipient'),
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

// A press used to blur the field, whose "required" error grew the bottom sheet and moved
// the list up, so the release missed the suggestion
it('picks a recipient suggestion tapped near its bottom edge', async () => {
  const page = await browser.newPage({ ...devices['iPhone 13'] });
  await page.goto(appUrl);
  await seedWallet(page, { addressBook: [CONTACT] });

  await page.goto(appUrl);
  await page.fill('[data-cy=password] input', TEST_ACCOUNT.password);
  await page.click('[data-cy=login-btn]');
  await page.click('[data-cy=send]');
  await page.fill('[data-cy=address] textarea', 'Save');
  await page.waitForSelector('[data-cy=address] .dropdown-wrapper.open');
  const suggestion = page.locator('[data-cy=address] [data-cy=address-suggestion]');
  const { width, height } = (await suggestion.boundingBox())!;

  // Taps once the opening list stops moving
  await suggestion.tap({ position: { x: width / 2, y: height * 0.85 } });

  await page.waitForSelector('[data-cy=address] .selected-address-container', { timeout: 5000 });
  expect(await page.locator('[data-cy=address] [data-cy=textarea]').inputValue()).toBe('');
  expect(await page.locator('[data-cy=address] [data-cy=input-field-message]').count()).toBe(0);
});
