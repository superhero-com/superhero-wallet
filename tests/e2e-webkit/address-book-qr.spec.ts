import os from 'os';
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

const ROOT = path.resolve(__dirname, '../..');
const PORT = Number(process.env.E2E_WEBKIT_PORT || 8093);
const APP_URL = `http://localhost:${PORT}`;

/** Stores a logged-in wallet the way the app does, with the app's own helpers. */
const seedWallet = `async ({ mnemonic, password }) => {
  const {
    encodeBase64,
    encrypt,
    generateEncryptionKey,
    generateSalt,
    prepareStorageKey,
  } = await import('/src/utils/index.ts');
  const { NETWORK_NAME_TESTNET, PROTOCOLS, STORAGE_KEYS } = await import('/src/constants/index.ts');
  const salt = generateSalt();
  const encryptionKey = await generateEncryptionKey(password, salt);
  const stored = {
    [STORAGE_KEYS.activeNetworkName]: NETWORK_NAME_TESTNET,
    [STORAGE_KEYS.mnemonic]: await encrypt(encryptionKey, mnemonic),
    [STORAGE_KEYS.encryptionSalt]: encodeBase64(salt),
    [STORAGE_KEYS.accountsRaw]: [{
      idx: 0,
      protocol: PROTOCOLS.aeternity,
      isRestored: true,
      type: 'hd-wallet',
    }],
    [STORAGE_KEYS.activeAccountGlobalIdx]: 0,
    [STORAGE_KEYS.otherSettings]: { isSeedBackedUp: true },
  };
  localStorage.clear();
  Object.entries(stored).forEach(([key, value]) => {
    localStorage.setItem(prepareStorageKey([key]), JSON.stringify(value));
  });
}`;

let server: ViteDevServer;
let browser: Browser;

beforeAll(async () => {
  // Read by vite.config.mts, as with `npm run test:e2e`
  Object.assign(process.env, { PLATFORM: 'web', RUNNING_IN_TESTS: 'true' });
  server = await createServer({
    root: ROOT,
    configFile: path.join(ROOT, 'vite.config.mts'),
    mode: 'development',
    // Apart from the prebundled dependencies of `npm run dev`
    cacheDir: path.join(os.tmpdir(), 'superhero-wallet-e2e-webkit'),
    server: { port: PORT, strictPort: true },
    logLevel: 'error',
  });
  await server.listen();
  browser = await webkit.launch();
});

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

// #3379: WebKit before 27 (iOS 26 and older) doesn't shrink a canvas wider than its box
it('keeps the address book QR code inside its box', async () => {
  const page = await browser.newPage();
  await page.goto(APP_URL);
  // A string, so Vitest leaves the dev server imports alone
  await page.evaluate(`(${seedWallet})(${JSON.stringify(TEST_ACCOUNT)})`);

  await page.goto(`${APP_URL}/more/address-book/add`);
  await page.fill('[data-cy=password] input', TEST_ACCOUNT.password);
  await page.click('[data-cy=login-btn]');
  await page.fill('[data-cy=name] textarea', 'QR code');
  await page.fill('[data-cy=address] textarea', TEST_ACCOUNT.addressAeternity);
  await page.waitForSelector('.qrcode:not(.hidden) canvas');

  const { box, canvas } = await page.$eval('.qrcode', (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const canvasRect = element.querySelector('canvas')!.getBoundingClientRect();
    return {
      box: {
        left: rect.left + parseFloat(style.paddingLeft),
        top: rect.top + parseFloat(style.paddingTop),
        right: rect.right - parseFloat(style.paddingRight),
        bottom: rect.bottom - parseFloat(style.paddingBottom),
      },
      canvas: {
        left: canvasRect.left,
        top: canvasRect.top,
        right: canvasRect.right,
        bottom: canvasRect.bottom,
      },
    };
  });

  expect(canvas.left).toBeGreaterThanOrEqual(box.left);
  expect(canvas.top).toBeGreaterThanOrEqual(box.top);
  expect(canvas.right).toBeLessThanOrEqual(box.right);
  expect(canvas.bottom).toBeLessThanOrEqual(box.bottom);
  // Not squashed either
  expect(canvas.right - canvas.left).toBeCloseTo(canvas.bottom - canvas.top, 0);
});
