import path from 'path';
import {
  afterAll,
  beforeAll,
  expect,
  it,
} from 'vitest';
import { webkit, type Browser } from 'playwright-core';
import { createServer, type ViteDevServer } from 'vite';
import { TEST_ACCOUNT } from '../fixtures/account';
import { seedWallet } from './fixtures/seed-wallet';

const ROOT = path.resolve(__dirname, '../..');
const DAPP_URL = 'https://dapp.example';

/** Opens the deep link in a popup and keeps what reaches it from the callback page. */
const dappPage = (deepLink: string) => `<button>Connect</button>
<script>
  window.messages = [];
  window.addEventListener('message', ({ data }) => window.messages.push(data));
  document.querySelector('button').onclick = () => {
    window.open(${JSON.stringify(deepLink)}, 'superhero-wallet', 'popup,width=375,height=600');
  };
</script>`;
const CALLBACK_PAGE = '<script>window.opener.postMessage(location.search, "*");</script>';

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
    cacheDir: path.join(ROOT, 'node_modules/.vite-e2e-webkit-deeplink'),
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

// #577: in Safari `window.open(url, '_self')` made the popup its own opener
it('returns to the dapp that opened a deep link in a popup', async () => {
  const deepLink = new URL('address', appUrl);
  deepLink.searchParams.set('x-success', `${DAPP_URL}/callback?address={address}`);
  deepLink.searchParams.set('x-cancel', `${DAPP_URL}/callback?cancelled=true`);
  const context = await browser.newContext();
  await context.route(`${DAPP_URL}/**`, (route) => route.fulfill({
    contentType: 'text/html',
    body: route.request().url().startsWith(`${DAPP_URL}/callback`)
      ? CALLBACK_PAGE
      : dappPage(deepLink.href),
  }));
  const wallet = await context.newPage();
  await wallet.goto(appUrl);
  await seedWallet(wallet);
  await wallet.close();

  const dapp = await context.newPage();
  await dapp.goto(DAPP_URL);
  const popupOpened = dapp.waitForEvent('popup');
  await dapp.click('button');
  const popup = await popupOpened;
  await popup.fill('[data-cy=password] input', TEST_ACCOUNT.password);
  await popup.click('[data-cy=login-btn]');
  // Denying needs no node connection
  await popup.click('[data-cy=deny]');
  // Allows the redirect to the dapp's site
  await popup.click('[data-cy=to-confirm]');

  await expect.poll(() => dapp.evaluate(() => (window as any).messages))
    .toEqual(['?cancelled=true']);
});
