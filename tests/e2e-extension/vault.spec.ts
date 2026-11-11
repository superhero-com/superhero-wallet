import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import type { Browser, Page } from 'puppeteer';
import { click, createWallet, launchBrowser } from './harness';

const PASSWORD = 'Str0ng-Pa55word';
/** An account's balance: shown only while the wallet is unlocked. */
const UNLOCKED = '[data-cy=balance-info]';
const PASSWORD_PROTECTION = '[data-cy=password-protection]';
/** Longer than a page waits for the key of a password another page changed. */
const SESSION_RESTORE_WAIT = 4000;

let browser: Browser;
let extensionId: string;
let first: Page;
let second: Page;

/** A new page of the extension at `route`: without one, it opens the last page used. */
async function openWallet(route = '/account') {
  const page = await browser.newPage();
  await page.goto(`chrome-extension://${extensionId}/index.html#${route}`);
  return page;
}

async function type(page: Page, selector: string, text: string) {
  const input = await page.waitForSelector(selector, { timeout: 30000 });
  await input!.type(text);
}

/** Flips the password protection switch and waits until it shows `isOn`. */
async function setProtection(page: Page, isOn: boolean, password?: string) {
  await page.waitForSelector(PASSWORD_PROTECTION, { timeout: 60000 });
  await click(page, `${PASSWORD_PROTECTION} .switch`);
  if (password) {
    await type(page, '[data-cy=password] input', password);
    await type(page, '[data-cy=confirm-password] input', password);
    await click(page, '[data-cy=btn-set-password]');
  }
  await page.waitForFunction(
    (selector, expected) => (
      (document.querySelector(selector) as HTMLInputElement)?.checked === expected
    ),
    { timeout: 30000, polling: 100 },
    `${PASSWORD_PROTECTION} input`,
    isOn,
  );
}

async function unlock(page: Page, password: string) {
  await type(page, '[data-cy=password] input', password);
  // Enabled once the typed password is validated.
  await click(page, '[data-cy=login-btn]:not(.disabled)');
}

/**
 * Ionic keeps hidden pages in the stack, so any match may be the shown one.
 * Polled on a timer: a background tab runs no animation frames.
 */
async function waitUntilShown(page: Page, selector: string) {
  await page.waitForFunction(
    (sel) => [...document.querySelectorAll(sel)].some((element) => element.checkVisibility()),
    { timeout: 60000, polling: 100 },
    selector,
  );
}

async function expectOpenWithoutPassword(page: Page) {
  await waitUntilShown(page, UNLOCKED);
  expect(await page.$('[data-cy=password]')).toBeNull();
}

beforeAll(async () => {
  ({ browser, extensionId } = await launchBrowser());
  first = await createWallet(browser, extensionId);
});

afterAll(async () => {
  await browser?.close();
});

describe('the password across pages of the extension', () => {
  it('opens another page without a password while the protection is off', async () => {
    second = await openWallet();
    await expectOpenWithoutPassword(second);
  });

  it('keeps the other pages open, without asking, once a password is set in one', async () => {
    const settings = await openWallet('/more/settings/secure-login');
    await setProtection(settings, true, PASSWORD);

    // They locked, and took the new key from the session rather than asking for it.
    await new Promise((resolve) => { setTimeout(resolve, SESSION_RESTORE_WAIT); });
    await expectOpenWithoutPassword(first);
    await expectOpenWithoutPassword(second);
  });

  it('asks for the new password once the wallet was locked', async () => {
    const more = await openWallet('/more');
    await click(more, '[data-cy=lock-wallet]');
    await more.waitForSelector('[data-cy=login-btn]', { timeout: 30000 });
    await second.reload();

    await unlock(second, 'wrong-password');
    await second.waitForSelector('[data-cy=password] [data-cy=input-field-message]', { timeout: 30000 });
    await second.reload();
    await unlock(second, PASSWORD);
    await waitUntilShown(second, UNLOCKED);
  });

  it('opens a new page without a password once the protection is turned off again', async () => {
    await setProtection(await openWallet('/more/settings/secure-login'), false);

    await expectOpenWithoutPassword(await openWallet());
  });
});
