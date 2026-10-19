import fs from 'fs';
import http from 'http';
import path from 'path';
import puppeteer, { type Browser, type Page, type Target } from 'puppeteer';

const ROOT = path.resolve(__dirname, '../..');
const EXTENSION_DIR = path.join(ROOT, 'dist/extension/chrome');
const PORT = Number(process.env.E2E_EXTENSION_PORT || 8091);

/** The same page on three origins: the wallet keeps their permissions apart. */
export const DAPP_URL = `http://localhost:${PORT}/dapp.html`;
export const OTHER_DAPP_URL = `http://127.0.0.1:${PORT}/dapp.html`;
export const AEPP_URL = `http://localhost:${PORT + 1}/dapp.html`;

const FILES: Record<string, [string, string]> = {
  '/dapp.html': [path.join(__dirname, 'dapp.html'), 'text/html'],
  '/aepp-sdk.js': [
    path.join(ROOT, 'node_modules/@aeternity/aepp-sdk/dist/aepp-sdk.browser-script.cjs'),
    'text/javascript',
  ],
};

function serveFiles(req: http.IncomingMessage, res: http.ServerResponse) {
  const file = FILES[new URL(req.url!, DAPP_URL).pathname];
  if (!file) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': file[1] });
  fs.createReadStream(file[0]).pipe(res);
}

export function startDappServers(): Promise<http.Server[]> {
  return Promise.all([PORT, PORT + 1].map((port) => new Promise<http.Server>((resolve) => {
    const server = http.createServer(serveFiles);
    server.listen(port, () => resolve(server));
  })));
}

export async function launchBrowser() {
  if (!fs.existsSync(path.join(EXTENSION_DIR, 'manifest.json'))) {
    throw new Error(`Build the extension first: no ${EXTENSION_DIR}`);
  }
  const browser = await puppeteer.launch({
    headless: !process.env.HEADFUL,
    enableExtensions: [EXTENSION_DIR],
    // The Ubuntu runners restrict the user namespaces Chrome's sandbox needs.
    args: process.env.CI ? ['--no-sandbox'] : [],
  });
  const worker = await browser.waitForTarget(
    (target) => target.type() === 'service_worker' && target.url().endsWith('/js/background.js'),
  );
  return { browser, extensionId: new URL(worker.url()).host };
}

export async function click(page: Page, selector: string) {
  const element = await page.waitForSelector(selector, { timeout: 30000 });
  // A DOM click works on elements outside the viewport, e.g. in a swiper.
  await element!.evaluate((el) => (el as HTMLElement).click());
}

/** Waits until a closing modal has left the page, so its buttons can't be found again. */
async function waitForRemoval(page: Page, selector: string) {
  await page.waitForFunction((sel) => !document.querySelector(sel), { timeout: 30000 }, selector);
}

const isPopup = (target: Target, extensionId: string) => target.url()
  .startsWith(`chrome-extension://${extensionId}/index.html?id=`);

/** The confirmation window the wallet opens for a dapp request. */
export async function waitForPopup(browser: Browser, extensionId: string) {
  const target = await browser.waitForTarget(
    (t) => isPopup(t, extensionId),
    { timeout: 30000 },
  );
  return (await target.asPage())!;
}

/** Runs `action`, failing as soon as the wallet opens a confirmation window instead. */
export async function withoutPopup<T>(
  browser: Browser,
  extensionId: string,
  action: () => Promise<T>,
): Promise<T> {
  let onTarget: (target: Target) => void;
  const popupOpened = new Promise<never>((_, reject) => {
    onTarget = (target) => {
      if (isPopup(target, extensionId)) {
        reject(new Error(`The wallet asked the user: ${target.url()}`));
        // Unanswered, it would hold back the next requests
        target.asPage().then((page) => click(page!, '[data-cy=deny]')).catch(() => {});
      }
    };
    browser.on('targetcreated', onTarget);
    browser.on('targetchanged', onTarget);
  });
  try {
    return await Promise.race([action(), popupOpened]);
  } finally {
    browser.off('targetcreated', onTarget!);
    browser.off('targetchanged', onTarget!);
  }
}

/** Creates a wallet with an Ethereum account and no password, as a new user does. */
export async function createWallet(browser: Browser, extensionId: string) {
  const page = await browser.newPage();
  await page.goto(`chrome-extension://${extensionId}/index.html`);
  await click(page, '[data-cy=checkbox] input');
  await click(page, '[data-cy=generate-wallet]');
  await click(page, '[data-cy=btn-add-ethereum]');
  await click(page, '[data-cy=btn-skip-password]');
  await page.waitForSelector('[data-cy=account-card-add]', { timeout: 60000 });
  await waitForRemoval(page, '[data-cy^=btn-add-]');
  return page;
}

/** Adds an account of the protocol and makes it the active one. */
export async function addAccount(page: Page, protocol: string) {
  await click(page, '[data-cy=account-card-add]');
  await click(page, `[data-cy=btn-add-${protocol}]`);
  await waitForRemoval(page, '[data-cy^=btn-add-]');
  await click(page, '[data-cy=create-plain-account]');
  await waitForRemoval(page, '[data-cy=create-plain-account]');
}

/**
 * Makes the first account the active one, as another wallet window does: through the
 * storage the offscreen document watches. Leaves the wallet page so it can't write it back.
 */
export async function switchToFirstAccount(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/icons/icon_48.png`);
  await page.evaluate(() => localStorage.setItem('sh-wallet_active-account-global-idx', '0'));
}
