/* eslint-disable no-console */
import { test, expect } from '@playwright/test';
import {
  Configuration, EyesRunner, Eyes, Target, MatchLevel,
} from '@applitools/eyes-playwright';
import { interceptApiRequests, switchToTestnet, addBitcoinAccount } from './commands';
import { initializeRunnerAndConfig } from './utils';

let Config: Configuration;
let Runner: EyesRunner;

test.beforeAll(() => {
  [Config, Runner] = initializeRunnerAndConfig('BTC');
});

test.describe('SH Wallet checks BTC', () => {
  let eyes: Eyes;

  test.beforeEach(async ({ page, context }) => {
    await interceptApiRequests(context);
    eyes = new Eyes(Runner, Config);

    // Start Applitools Visual AI Test
    // Args: Playwright Page, App Name, Test Name, Viewport Size for local driver
    await eyes.open(page, 'SH Wallet', test.info().title, { width: 360, height: 600 });
    await page.goto('./');
  });

  test('SH Wallet_rst_add btc acc_testnet', async ({ page }) => {
    await switchToTestnet(page, expect);
    await page.getByTestId('bullet-switcher-add').click();
    await page.getByTestId('account-card-add').click();
    await eyes.check('Add BTC account', Target.window().fully());
    await page.getByTestId('btn-add-bitcoin').click();
    await page.getByTestId('create-plain-account').last().click();
    await expect(page.getByTestId('account-name-number').last()).toContainText('Bitcoin account');
    await eyes.check('Add BTC account', Target.window().matchLevel(MatchLevel.Layout));
  });

  test('SH Wallet_rst_receive btc_mainnet', async ({ page }) => {
    // Add BTC account to be visible
    await addBitcoinAccount(page, expect);
    // Open Receive screen from Dashboard
    await page.getByTestId('receive').click();
    await page.getByTestId('btn-close').click();
    // Open Receive screen from Account details page
    await page.locator('//a[@data-cy="account-card-base"]//span[text()="BTC"]').click();
    await page.locator('//div[@class="horizontal-scroll buttons"]//span[text()="Receive"]').click();
    await expect(page.getByRole('heading')).toContainText('Receive Bitcoin to public address');
    await expect(page.getByText('Request specific amount')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();

    await page.locator('//button[@data-cy="copy"]').click();
    await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();

    await eyes.check('Receive_BTC', Target.window().fully());
    // Link to BTC explorer
    const page1Promise = page.waitForEvent('popup');
    await page.locator('//div[@class="address-truncated address"]').click();
    const page1 = await page1Promise;
    await page.waitForTimeout(800);
    if (await page1.locator('//div[@id="explorer"]//a[@class="navbar-brand"]').isVisible() === true) {
      console.assert(await page1.locator('//div[@class="addr-page"]').nth(0).innerText() === 'bc1qkwagn38f4zv80wdlhw539vn7geyvsyaj79jejw');
    } else {
      console.log('Blockstream was not available');
    }
    // await expect(page1.locator('//div[@class="block-hash"]'))
    // .toContainText('bc1qkwagn38f4zv80wdlhw539vn7geyvsyaj79jejw');
  });

  test('SH Wallet_rst_btc_send_screen', async ({ page }) => {
    // Add BTC account to be visible
    await addBitcoinAccount(page, expect);
    // Open Send screen from dashboard
    await page.getByRole('button', { name: 'Send' }).click();
    await page.getByTestId('btn-close').click();
    // Open Send screen from Account details page
    await page.locator('//a[@data-cy="account-card-base"]//span[text()="BTC"]').click();
    await page.locator('//div[@class="horizontal-scroll buttons"]/button[@data-cy="send"]').click();

    // Check Send main screen
    await eyes.check('Send Bitcoin', Target.window().matchLevel(MatchLevel.Strict));
    await expect(page.getByRole('heading', { name: 'Send Bitcoin' })).toBeVisible();
    await expect(page.getByText('Transaction fee')).toBeVisible();

    // Open Recipient help pop up, make screen check, close pop up
    await page.locator('//div[@class="transfer-send-recipient"]//button[@class="btn-help button-plain btn-help"]').click();
    await eyes.check('Recipient_help', Target.window().fully());
    await page.getByRole('button', { name: 'OK' }).click();

    // Check info/error msg
    // Missing receiver address
    await page.getByTestId('textarea').click();
    await page.getByTestId('input').click();
    await expect(page.locator('//div[@data-cy="address"]//label[@data-cy="input-field-message"]'))
      .toContainText('This field is required');
    // Missing amount value
    await page.getByTestId('textarea').click();
    await expect(page.locator('//div[@data-cy="amount"]//label[@data-cy="input-field-message"]'))
      .toContainText('This field is required');

    // Incorrect address string
    await page.getByTestId('textarea').fill('12345678');
    await expect(page.locator('//div[@data-cy="address"]//label[@data-cy="input-field-message"]'))
      .toContainText('Invalid bitcoin address');

    // Sender and receiver the same address
    await page.getByTestId('textarea').fill('bc1qkwagn38f4zv80wdlhw539vn7geyvsyaj79jejw');
    await expect(page.locator('//div[@data-cy="address"]//label[@data-cy="input-field-message"]'))
      .toHaveText("Sender's and recipient's addresses are the same. You are about to send BTC to your own account.");

    // Close Send screen
    await page.getByTestId('btn-close').nth(1).click();
  });

  test('SH Wallet_rst_btc_send_screen_mainnet', async ({ page }) => {
    // Add BTC account to be visible
    await addBitcoinAccount(page, expect);
    // Open Send screen from dashboard
    await page.getByRole('button', { name: 'Send' }).click();
    // Check Send main screen with transaction fee information
    await expect(page.getByText('Transaction speed')).toBeVisible();
    await eyes.check('Send Bitcoin mainnet txn fee', Target.window().fully());
  });

  test('SH Wallet_rst_btc_acc details_testnet', async ({ page }) => {
    await switchToTestnet(page, expect);
    // Add BTC account to be visible
    await addBitcoinAccount(page, expect);
    // Check account information screen
    await page.locator('//a[@data-cy="account-card-base"]//span[text()="BTC"]').click();

    await expect(page.getByTestId('list')).toContainText('Received', { timeout: 10000 });
    await expect(page.getByTestId('list')).toContainText('Sent');
    await eyes.check('BTC acc screen', Target.window().matchLevel(MatchLevel.Layout));

    await expect(page.getByTestId('list')).toContainText('BTC');
    await expect(page.locator('#app-wrapper')).toContainText('BTC');
    await expect(page.locator('#app-wrapper')).toContainText('Bitcoin account');
    await page.getByRole('link', { name: 'Received' }).click();
    // Check BTC explorer link
    const page2Promise = page.waitForEvent('popup');
    await page.getByRole('link', { name: 'View transaction in' }).click();
    const page2 = await page2Promise;
    await expect(page2.locator('#transaction-box')).toContainText('tb1qca3vvfkzwgs2msss56d7x7prgmlua9qf2j0rnf', { timeout: 10000 });
  });

  test('SH Wallet_rst_btc_more_disabled_options', async ({ page }) => {
    // Check for BTC if some More options are not available
    // Add BTC account to be visible
    await addBitcoinAccount(page, expect);
    // Open More
    await page.locator('//a[@data-cy="page-more"]').click();
    await eyes.check('BTC More options', Target.window().fully());
  });

  test('SH Wallet_rst_btc_send_no_balance_for_txn_fee', { tag: ['@functional'] }, async ({ page }) => {
    await switchToTestnet(page, expect);
    // Add BTC account to be visible
    await addBitcoinAccount(page, expect);
    // Add BTC account to be visible
    await addBitcoinAccount(page, expect);
    // Open send and make transaction
    await page.getByRole('button', { name: 'Send assets to others' }).click();
    await page.locator('//textarea[@data-cy="textarea"]').fill('tb1qgygjzxl69hr7e0la295824n8nwz6cxpa07fs9p');
    await page.locator('//input[@name="amount"]').fill('12');
    // As the mainnet account does not have any coins, the error message will be different
    await expect(page.locator('//div[@data-cy="amount"]//label[@data-cy="input-field-message"]'))
      .toContainText('BTC balance is not enough to pay for transaction fee', { timeout: 8000 });
  });

  test('SH Wallet_rst_btc_share_account_address', async ({ page }) => {
    // Check Share screen

    await switchToTestnet(page, expect);
    // Add BTC account to wallet
    await addBitcoinAccount(page, expect);
    // Open Account details screen
    await page.locator('//a[@data-cy="account-card-base"]//span[text()="BTC"]').click();
    await page.locator('//button[@data-cy="share-address"]').click();
    await eyes.check('Share your public address_BTC', Target.window().fully());
    await page.getByTestId('btn-close').nth(1).click();
  });

  test('SH Wallet_rst_btc_import_key', async ({ page }) => {
    // Checking account counter which does appear >=6 accounts
    await switchToTestnet(page, expect);
    await page.getByTestId('bullet-switcher-add').click();
    await page.getByTestId('account-card-add').click();
    await page.getByTestId('btn-add-bitcoin').click();
    await page.locator('//button[@header="Import with private key"]').click();
    await expect(page.locator('//div[@class="heading text-center"]')).toContainText('Import Bitcoin account');
    // Account private key helper text
    await page.locator('//div[@data-cy="field-private-key"]//button').click();
    await eyes.check('Prvate Key helper', Target.window().fully());
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByPlaceholder('Enter or paste your private key here').fill('95a74a5d7e7c43cbbcc2d66fd850b8fa59d99e4a70460519d1f1dcb2b19bb8d2');
    await page.getByTestId('btn-import').click();
    await expect(page.locator('//div[@data-cy="account-name-number"]').last()).toHaveText('PK Bitcoin account 1');
    await page.locator('//div[@data-cy="account-name-number"]').last().click();
    await page.locator('//div[@class="horizontal-scroll buttons"]//button[@data-cy="receive"]').click();
    await expect(page.getByRole('heading')).toContainText('Receive Bitcoin to public address');
  });

  test.afterEach(async () => {
    // End Applitools Visual AI Test
    await eyes.closeAsync();
  });
});

test.afterAll(async () => {
  // Wait for Ultrast Grid Renders to finish and gather results
  await Runner.getAllTestResults();
});
