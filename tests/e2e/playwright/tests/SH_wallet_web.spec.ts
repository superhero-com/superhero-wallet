/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import { test, expect } from '@playwright/test';
import {
  Configuration, EyesRunner, Eyes, Target, MatchLevel,
} from '@applitools/eyes-playwright';
import BigNumber from 'bignumber.js';

import { RestoreWalletData } from '../test-data/login.data';
import { WelcomePage } from '../pages/welcome.page';
import {
  openWalletSettings,
  resetWallet,
  switchToTestnet,
  interceptApiRequests,
  revokePendingProposal,
  addBitcoinAccount,
  addEthereumAccount,
  addAeternityAccount,
} from './commands';
import { genRandomString, initializeRunnerAndConfig } from './utils';

let Config: Configuration;
let Runner: EyesRunner;

test.beforeAll(() => {
  [Config, Runner] = initializeRunnerAndConfig('AE');
});

test.describe('SH Wallet checks', () => {
  let eyes: Eyes;

  const { aeAccAddress, secAeAccAddress, secAeAccChainName } = RestoreWalletData;
  const txnValue = 0.002;

  test.beforeEach(async ({ page, context }) => {
    await interceptApiRequests(context);
    eyes = new Eyes(Runner, Config);

    // Start Applitools Visual AI Test
    // Args: Playwright Page, App Name, Test Name, Viewport Size for local driver
    await eyes.open(page, 'SH Wallet', test.info().title, { width: 360, height: 600 });
    await page.goto('./');
  });

  test.afterEach(async () => {
    // End Applitools Visual AI Test
    await eyes.closeAsync();
  });

  test('SH Wallet_new_wallet and dashboard', async ({ page }) => {
    // Create a new Wallet and check initial dashboard screen
    await resetWallet(page);
    const welcomePage = new WelcomePage(page);
    await welcomePage.acceptanceTerms.first().click();
    await eyes.check('Terms', Target.window().fully());
    // Act
    await page.getByRole('button', { name: 'Create new wallet Get started with Superhero Wallet' }).click();
    // Select account to be added
    await page.getByTestId('btn-add-aeternity').click();
    await page.getByTestId('btn-help').click();
    await eyes.check('Set a password', Target.window().fully());
    await page.getByTestId('btn-close').click();
    await welcomePage.SetPassword();
    // Assert
    await expect(page.getByRole('button', { name: 'Receive from existing wallet' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send assets to others' })).toBeVisible();
    // await expect(page.getByText('Claim your own .chain name')).toBeVisible();
    await expect(page.getByText('Back up now')).toBeVisible();
    // Check if a second account wasn't created
    await expect(page.locator('//a[@data-cy="account-card-base" and @idx="1"]')).not.toBeVisible();
    await eyes.check('Dashboard', Target.window().fully());
  });

  test('SH Wallet_rst_wallet', async ({ page }) => {
    // Recover Wallet from seed phrase and check if account address is correct
    await resetWallet(page);
    const welcomePage = new WelcomePage(page);
    await welcomePage.recoveredWalletLogin(RestoreWalletData.testWalletSeed);
    await expect(page.getByText('Connected')).not.toBeVisible();
    await eyes.check('RecoverWallet', Target.window().fully());
    await page.getByRole('button', { name: 'Receive from existing wallet' }).click();
    await expect(page.locator('a').filter({ hasText: aeAccAddress })).toBeVisible();
  });

  test('SH Wallet_rst_receive_screen', async ({ page }) => {
    // Check the AE Receive screen
    // Open Receive screen from Dashboard
    await page.getByRole('button', { name: 'Receive from existing wallet' }).click();
    await page.getByTestId('btn-close').click();

    // Open Receive screen from Account details page
    await page.getByTestId('account-card-base').first().click();
    await page.locator('//div[@class="horizontal-scroll buttons"]//button[@data-cy="receive"]').click();
    await expect(page.getByRole('heading')).toContainText('Receive funds to public address');
    await expect(page.getByText('Request specific amount')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();

    // Copy the account address
    await page.locator('//button[@data-cy="copy"]').click();
    await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();
    await eyes.check('Receive_ae', Target.window().matchLevel(MatchLevel.Layout));

    // The the ae account address from the URL to aescan
    // and check if it match the current account address
    const aeAddressStr = await page.locator('//div[@class="account-row"]//a').getAttribute('href') as string;
    const aeAddress = aeAddressStr.slice(aeAddressStr.length - 53);
    console.assert(aeAddress === aeAccAddress);

    // Open aeScan
    const page1Promise = page.waitForEvent('popup');
    await page.locator('//div[@class="account-row"]').click();
    const page1 = await page1Promise;
    // Check if link to aescan.io does open the correct account page
    if (await page1.getByAltText('æScan logo').first().isVisible() === true) {
      console.assert(await page1.locator('//div[@class="copy-chip__text"]').nth(0).innerText() === aeAccAddress);
    } else {
      console.log('aeScan was not available');
    }

    // Receive amount is 0
    await page.locator('//input[@name="amount"]').fill('0');
    await expect(page.getByTestId('input-field-message')).toHaveText('Amount must be more than 0.');
  });

  test('SH Wallet_rst_send_screen', async ({ page }) => {
    // Check the AE Send screen with error input messages
    // Open Send screen from dashboard
    await page.getByRole('button', { name: 'Send assets to others' }).click();
    await page.getByTestId('btn-close').click();
    // Open Send screen from Account details page
    await page.getByTestId('account-card-base').first().click();
    await page.locator('//div[@class="horizontal-scroll buttons"]//button[@data-cy="send"]').click();

    // Check Send main screen
    await eyes.check('Send_ae', Target.window().matchLevel(MatchLevel.Layout)); Target.window().fully();
    await expect(page.getByRole('heading', { name: 'Send funds' })).toBeVisible();
    await expect(page.getByText('Transaction fee')).toBeVisible();

    // Open Recipient help pop up, make screen check, close pop up
    await page.getByTestId('address').getByRole('button').first().click();
    await eyes.check('Recipient_help', Target.window().fully());
    await page.getByRole('button', { name: 'OK' }).click();

    // Check info/error msg

    // Missing receiver address
    await page.locator('//textarea[@data-cy="textarea"]').click();
    await page.locator('//input[@name="amount"]').click();
    await expect.soft(page.locator('//div[@data-cy="address"]//label[@data-cy="input-field-message"]'))
      .toContainText('This field is required');

    // Missing amount value
    await page.locator('//textarea[@data-cy="textarea"]').click();
    await expect(page.locator('//div[@data-cy="amount"]//label[@data-cy="input-field-message"]'))
      .toContainText('This field is required');

    // Incorrect address string
    await page.locator('//textarea[@data-cy="textarea"]').fill('12345678');
    await expect(page.locator('//div[@data-cy="address"]//label[@data-cy="input-field-message"]'))
      .toContainText('Invalid address or .chain name');

    // Send amount over max available
    await page.locator('//input[@name="amount"]').fill('12345678');
    await page.locator('//textarea[@data-cy="textarea"]').click();
    await expect(page.locator('//div[@data-cy="amount"]//label[@data-cy="input-field-message"]'))
      .toContainText('Amount exceeds maximum available:');

    // Send amount is 0
    await page.locator('//input[@name="amount"]').fill('0');
    await page.locator('//textarea[@data-cy="textarea"]').click();
    // expect(page.locator('//div[@data-cy="amount"]//label[@data-cy="input-field-message"]')).
    // toHaveText('Amount must be more than 0.');

    // Sender and receiver the same address
    await page.locator('//textarea[@data-cy="textarea"]').fill(aeAccAddress);
    await expect(page.locator('//div[@data-cy="address"]//label[@data-cy="input-field-message"]'))
      .toHaveText("Sender's and recipient's addresses are the same. You are about to send AE to your own account.");

    // Open Payload help pop up, make screen check, close pop up
    await page.locator('//div[@class="payload-add-wrapper"]/button[@class="btn-help button-plain btn-help"]').click();
    await eyes.check('Payload_help', Target.window().fully());
    await page.getByRole('button', { name: 'OK' }).click();

    // Open Payload screen
    await page.getByRole('button', { name: 'Payload' }).click();
    await page.getByLabel('Payload message').fill('Hello. This is a test!');
    await eyes.check('Add_Payload', Target.window().fully());
    // Close Payload pop up
    await page.getByRole('button', { name: 'Done' }).click();
    await page.waitForTimeout(500);
    // Check Send screen with payload message
    await eyes.check('Send_ae_Payload', Target.window().matchLevel(MatchLevel.Strict));
    // Close Send screen
    await page.getByTestId('btn-close').nth(1).click();
  });

  test('SH Wallet_rst_account_details', async ({ page }) => {
    // Check the Account Asset tab
    await resetWallet(page);
    const welcomePage = new WelcomePage(page);
    await welcomePage.recoveredWalletLogin(RestoreWalletData.virginWalletSeed);
    // Select account to be added
    await page.getByTestId('btn-add-aeternity').click();
    // Open Account details screen
    await page.getByTestId('account-card-base').first().click();
    await page.waitForTimeout(500);
    // If the loader takes longer then 10 sec to show the no transactions message,
    // check if loader is visible
    if (await page.locator('//p[@class="message"]').isVisible({ timeout: 10000 }) === true) {
      await expect(page.locator('//p[@class="message"]')).toContainText('There are no recent transactions for this account.');
    } else {
      console.log('Loader is visible!');
    }
    await eyes.check('acc_details', Target.window().fully());

    // Open Assets tab
    await page.getByRole('link', { name: 'Assets' }).click();
    await eyes.check('acc_details_assets', Target.window().fully());

    // Open Names tab
    await page.getByRole('link', { name: 'Names' }).click();
    await expect(page.locator('//div[@class="register-name"]')).toBeVisible();
    await eyes.check('acc_details_names_mynames', Target.window().matchLevel(MatchLevel.Layout));
    await expect(page.getByRole('paragraph')).toContainText('There are no .chain names owned by this account. Would you like to register one?');

    // Open Auctions
    await page.getByText('Auctions').click();
    await eyes.check('acc_details_names_auctions', Target.window().matchLevel(MatchLevel.Layout));

    // Open Register name
    await page.getByText('Register name').click();
    await page.waitForTimeout(100);
    await expect(page.getByRole('paragraph')).toContainText('Ownership of .chain names shorter than 13 characters will be acquired at an auction by the account that places the highest bid.');
    await eyes.check('acc_details_names_registerName', Target.window().fully());
    await page.locator('//div[@class="claim"]//input[@data-cy="input"]').click();
    await page.getByText('Register name').first().click();
    await expect(page.getByText('This field is required')).toBeVisible();
    await page.locator('//div[@class="claim"]//input[@data-cy="input"]').fill('A');
    await expect(page.getByText('AE balance is not enough to pay for transaction fee')).toBeVisible();

    // Open auto extend name help pop up
    await page.locator('label').filter({ hasText: 'Auto extend name' }).getByRole('button').click();
    await eyes.check('acc_details_names_autoExtendName_popUp', Target.window().fully());
    await page.getByRole('button', { name: 'OK' }).click();

    // Close Account details screen
    await page.getByRole('button').first().click();
  });

  test('SH Wallet_rst_network_btn', async ({ page }) => {
    // Check the possibility to change to Network from Mainnet to Testnet on Dashboard
    // Change network to Testnet
    await page.getByRole('button', { name: ' Mainnet' }).hover({ timeout: 5000 });
    await eyes.check('Network button indicator hover effect_Mainnet', Target.window().matchLevel(MatchLevel.Layout));
    await switchToTestnet(page, expect);
    await page.getByRole('button', { name: ' Testnet', exact: true }).hover();
    await eyes.check('Network button indicator hover effect_Testnet', Target.window().matchLevel(MatchLevel.Layout));
  });

  test('SH Wallet_rst_balance_check_mainnet', async ({ page }) => {
    // Check the Account balance of the first Wallet acc against the account amount info in aeScan
    // Open Account details screen

    await page.getByTestId('account-card-base').first().click();
    // Open aeScan of this account and take the AE balance
    await page.locator('//div[@class="horizontal-scroll buttons"]//button[@data-cy="receive"]').click();
    // Opens new tab with aescan
    const page2Promise = page.waitForEvent('popup');
    await page.locator('//div[@class="account-row"]').click();
    const page2 = await page2Promise;
    let aeScanBalance: string = await page2.locator('//tr[@class="account-details-panel__row"]//div[@class="price-label"]').first()
      .textContent() as string;
    //  Convert the balance string from aeScan
    // to the same format as it is in the Wallet account details page
    let aeScan: string;
    const aeScanInt = aeScanBalance.substring(0, aeScanBalance.indexOf('.'));

    // Check if the amount in aeScan is a whole number if so add ".00" to it
    if (aeScanInt.length === 0) {
      aeScan = aeScanBalance.substring(0, aeScanBalance.indexOf(' '));
      aeScan += '.00';
    } else {
      aeScanBalance = aeScanBalance.split(',').join('');
      const aeScanFloat = aeScanBalance.slice(0, -3);
      const aeScanToken = parseFloat(aeScanFloat);
      aeScan = aeScanToken.toFixed(2);
    }
    await page.getByTestId('btn-close').nth(1).click();
    await page.locator('//div[@class="transaction-token-rows"]').nth(0).isVisible();
    // Take the account balance which are two strings and concatenate them
    const aeTokenInt: string = await page.locator('//div[@class="account-details"]//div[@data-cy="balance-info"]//span[@class="asset-integer"]')
      .textContent() as string;
    const aeTokenFraction: string = await page.locator('//div[@class="account-details"]//div[@data-cy="balance-info"]//span[@class="asset-fractional"]')
      .textContent() as string;
    let aeToken = aeTokenInt.concat(aeTokenFraction);
    // Compare the aeScan balance with the wallet account balance
    aeToken = aeToken.split(',').join('');
    expect(aeScan).toBe(aeToken);
  });

  test('SH Wallet_rst_balance_check_testnet', async ({ page }) => {
    await switchToTestnet(page, expect);
    // Open Account details screen
    await page.getByTestId('account-card-base').first().click();
    // Open aeScan of this account and take the AE balance
    await page.locator('//div[@class="horizontal-scroll buttons"]//button[@data-cy="receive"]').click();
    // Opens new tab with aescan
    const page2Promise = page.waitForEvent('popup');
    await page.locator('//div[@class="account-row"]').click();
    const page2 = await page2Promise;
    await page.waitForTimeout(5000);
    let aeScanBalance: string = await page2.locator('//tr[@class="account-details-panel__row"]//div[@class="price-label"]').first()
      .textContent() as string;
    //  Convert the balance string from aeScan
    // to the same format as it is in the Wallet account details page
    let aeScan: string;
    const aeScanInt = aeScanBalance.substring(0, aeScanBalance.indexOf('.'));

    // Check if the amount in aeScan is a whole number if so add ".00" to it
    if (aeScanInt.length === 0) {
      aeScan = aeScanBalance.substring(0, aeScanBalance.indexOf(' '));
      aeScan += '.00';
    } else {
      // Align the aeScan amount to the shown Wallet amount
      aeScanBalance = aeScanBalance.split(',').join('');
      const aeScanFloat = aeScanBalance.slice(0, -3);
      const aeScanToken = parseFloat(aeScanFloat);
      aeScan = aeScanToken.toFixed(2);
    }
    await page.getByTestId('btn-close').nth(1).click();
    await page.locator('//div[@class="transaction-token-rows"]').nth(0).isVisible();
    // Take the account balance which are two strings and concatenate them
    const aeTokenInt: string = await page.locator('//div[@class="account-details"]//div[@data-cy="balance-info"]//span[@class="asset-integer"]')
      .textContent() as string;
    const aeTokenFraction: string = await page.locator('//div[@class="account-details"]//div[@data-cy="balance-info"]//span[@class="asset-fractional"]')
      .textContent() as string;
    let aeToken = aeTokenInt.concat(aeTokenFraction);
    // Compare the aeScan balance with the wallet account balance
    aeToken = aeToken.split(',').join('');
    expect(aeScan).toBe(aeToken);
  });

  test('SH Wallet_rst_more_seed phrase verification', async ({ page }) => {
    // Check the Seed Phrase verification function in the Wallet settings.
    // It is using the Seed Phrase of the Test Wallet,
    // that's why the seed phrase is hard coded in this test.

    await openWalletSettings(page);
    await page.locator('a').filter({ hasText: 'Seed phrase' }).click();
    await eyes.check('Seed phrase info msg', Target.window().fully());
    await page.getByText('Show seed phrase').click();
    await eyes.check('Seed phrase', Target.window().fully());
    // Verify your seed phrase screen
    await page.getByText('Verify your seed phrase', { exact: true }).click();

    // Enter seed phrase
    await page.getByRole('button', { name: 'cream' }).click();
    await page.getByRole('button', { name: 'anger' }).click();
    await page.getByRole('button', { name: 'stove' }).click();
    await page.getByRole('button', { name: 'cause' }).click();
    await page.getByRole('button', { name: 'myth' }).click();
    await page.getByRole('button', { name: 'spread' }).click();
    await page.getByRole('button', { name: 'citizen' }).click();
    await page.getByRole('button', { name: 'elephant' }).click();
    await page.getByRole('button', { name: 'twenty' }).click();
    await page.getByRole('button', { name: 'soda' }).click();
    await page.getByRole('button', { name: 'frown' }).click();
    await page.getByRole('button', { name: 'brain' }).click();
    await page.getByRole('button', { name: 'Verify seed phrase' }).click();
    await expect(page.getByText('Seed phrase has been verified!')).toBeVisible();
    await eyes.check('Seed phrase verified', Target.window().matchLevel(MatchLevel.Layout));
    await page.getByTestId('btn-close').click();
  });

  test('SH Wallet_rst_more_seed phrase verification_failure', async ({ page }) => {
    // Check the Seed Phrase verification function in the Wallet settings.
    // The test is using the a Test Seed in wrong order, aiming the Seed verification to fail.

    await openWalletSettings(page);
    await page.locator('a').filter({ hasText: 'Seed phrase' }).click();
    await eyes.check('Seed phrase info msg', Target.window().fully());
    await page.getByText('Show seed phrase').click();
    await eyes.check('Seed phrase', Target.window().fully());
    // Verify your seed phrase screen
    await page.getByText('Verify your seed phrase', { exact: true }).click();
    // Enter seed phrase in wrong order
    await page.getByRole('button', { name: 'cream' }).click();
    await page.getByRole('button', { name: 'anger' }).click();
    await page.getByRole('button', { name: 'stove' }).click();
    await page.getByRole('button', { name: 'cause' }).click();
    await page.getByRole('button', { name: 'myth' }).click();
    await page.getByRole('button', { name: 'spread' }).click();
    await page.getByRole('button', { name: 'citizen' }).click();
    await page.getByRole('button', { name: 'elephant' }).click();
    await page.getByRole('button', { name: 'twenty' }).click();
    await page.getByRole('button', { name: 'frown' }).click();
    await page.getByRole('button', { name: 'soda' }).click();
    await page.getByRole('button', { name: 'brain' }).click();
    await page.getByRole('button', { name: 'Verify seed phrase' }).click();
    await expect(page.getByText('Seed phrase words are not in the correct order. Please enter your seed phrase again!')).toBeVisible();
    await eyes.check('Seed phrase again', Target.window().fully());
    await page.getByTestId('btn-close').click();
  });

  test('SH Wallet_rst_more_network change', async ({ page }) => {
    // Check the Network settings, changing the network and adding custom network
    // Open network menu

    await page.getByRole('button', { name: 'Mainnet' }).click();
    await expect(page.getByRole('paragraph')).toContainText('Connect to network');
    await eyes.check('Connect to network menu', Target.window().fully());

    // Select Testnet
    await page.getByRole('button', { name: 'Testnet Connect to testnet' }).click();
    await expect(page.locator('ion-toolbar')).toContainText('Testnet');

    // Open Network menu and select Mainnet
    await page.getByRole('button', { name: 'Testnet' }).first().click();
    await page.getByRole('button', { name: 'Mainnet Connect to mainnet' }).click();
    await expect(page.locator('ion-toolbar')).toContainText('Mainnet');

    // Open Network menu and select more
    await page.getByRole('button', { name: 'Mainnet' }).first().click();
    await page.locator('//a[@header="More"]').click();
    await expect(page.getByText('Connecting to the node...')).not.toBeVisible();
    await expect(page.getByText('Connected')).not.toBeVisible();
    await eyes.check('Network selection screen', Target.window().fully());

    // Add custom network screen
    await page.locator('//a[@data-cy="to-add"]').click();
    await page.getByLabel('Network name').fill('Regression test');
    await page.locator('//button[@data-cy="btn-add-network"]').click();

    // Check if new network was added
    await expect(page.locator('#app-wrapper')).toContainText('Regression test');

    // Remove custom network
    await page.locator('span').filter({ hasText: 'Regression test' }).getByRole('button').click();
    await expect(page.locator('#app-wrapper')).toContainText('Are you sure you want to delete this custom network?');
    await eyes.check('Remove custom network', Target.window().fully());
    await page.getByRole('button', { name: 'Confirm' }).click();
    // Removed Test network should not be listed anymore
    await expect(page.locator('//p[@data-cy="network-name" and text()="Regression test"]')).not.toBeVisible();
  });

  test('SH Wallet_rst_more_permissions', async ({ page }) => {
    // Check Permission screen and adding custom permission
    await openWalletSettings(page);
    // Open Permissions
    await page.locator('a').filter({ hasText: 'Permissions' }).click();
    await eyes.check('Permissions', Target.window().fully());
    await page.getByText('Add permission').click();
    await page.getByLabel('Permissions for URL').fill('chat.superhero.com');
    await page.getByLabel('Custom name').fill('Custom perm test');
    await page.locator('//div[@class="switch-button"]//label//span').last().click();
    await page.locator('//div[@class="switch-button"]//label//span').last().click();
    await page.locator('//div[@class="switch-button"]//label//span').last().click();
    await page.locator('//div[@class="switch-button"]//label//span').last().click();
    await page.locator('//input[@name="transactionSignLimit"]').fill('1000');
    await eyes.check('Custom permission', Target.region(page.locator('//div[@class="container"]')).fully().matchLevel(MatchLevel.Layout));
    await page.locator('//button[text()="Confirm"]').click();
    // Check if new custom permission was added
    await page.waitForTimeout(500);
    await expect(page.locator('//button//div/div[text()="Custom perm test"]')).toBeVisible();
    // Remove custom permission
    await page.locator('button').filter({ hasText: 'Custom perm test' }).click();
    await page.getByRole('button', { name: 'Remove permission' }).click();
    await expect(page.locator('#app-wrapper')).not.toContainText('Custom perm test');
    // Close menu
    await page.getByTestId('btn-close').last().click();
  });

  test('SH Wallet_rst_more_notifications', async ({ page }) => {
    // Wallet notifications screen check
    await openWalletSettings(page);
    // Open Notifications menu
    await page.locator('a').filter({ hasText: 'Notifications' }).click();
    await eyes.check('Notifications', Target.window().matchLevel(MatchLevel.Layout));
    await page.getByTestId('btn-close').click();
  });

  test('SH Wallet_rst_more_language', async ({ page }) => {
    // Available languages check
    await openWalletSettings(page);
    // Open Language menu
    await page.locator('a').filter({ hasText: 'Language' }).click();
    await expect(page.getByText('Connected')).not.toBeVisible();
    await eyes.check('Language', Target.window().fully());
    // Close menu
    await page.getByTestId('btn-close').click();
  });

  test('SH Wallet_rst_more_currency', async ({ page }) => {
    // Superhero Wallet fiat currency conversion selection screen check
    await openWalletSettings(page);
    // Open currency menu
    await page.locator('a').filter({ hasText: 'Currency' }).click();
    await expect(page.getByText('Connected')).not.toBeVisible();
    await eyes.check('Currency', Target.window().fully());
    // Select Euro from the list
    await page.locator('label').filter({ hasText: 'eur (€) Euro' }).locator('span').first()
      .click();
    await page.getByTestId('btn-close').click();
    // Check if Euro is visible on account card
    await expect(page.locator('#app-wrapper')).toContainText('€');
  });

  test('SH Wallet_rst_more_saveErrorLog', async ({ page }) => {
    // Error log switch screen check
    await openWalletSettings(page);
    // Open Error log menu
    await page.getByText('Error log').click();
    await expect(page.getByRole('paragraph').first()).toContainText('Superhero Wallet is able of maintaining an error log file on your device, recording the last 1,000 errors encountered.');
    await expect(page.locator('//div[@class="switch-button"]//div')).toHaveText('Keep error log');
    await page.locator('//div[@class="switch-button"]//label//span').first().click();
    await page.getByTestId('back-arrow').click();
    await expect(page.locator('#app-wrapper')).toContainText('On');
    await eyes.check('Error log', Target.window().fully());
    // Close menu
    await page.getByTestId('btn-close').click();
  });

  test('SH Wallet_rst_more_walletReset', async ({ page }) => {
    await openWalletSettings(page);
    // Open Reset Wallet menu
    await page.locator('a').filter({ hasText: 'Reset wallet' }).click();
    await eyes.check('Reset wallet', Target.window().fully());
    await page.getByRole('button', { name: 'Reset wallet' }).click();
    await eyes.check('Reset wallet confirmation', Target.window().fully());
    // Cancel wallet reset
    await page.getByRole('button', { name: 'Cancel' }).click();
    // Select Reset wallet
    await page.getByRole('button', { name: 'Reset wallet' }).click();
    // Confirm wallet reset
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    // Welcome screen open
    await expect(page.locator('ion-content')).toContainText('The multi-blockchain wallet to manage crypto assets and navigate', { timeout: 10000 });
    await eyes.check('Welcome after reset', Target.window().fully());
  });

  test('SH Wallet_rst_more_claimTips', async ({ page }) => {
    // Open Wallet settings

    await page.locator('//a[@data-cy="page-more"]').click();
    // Open Claim tips
    await page.locator('a').filter({ hasText: 'Claim tips' }).click();
    // Open Claim tips help
    await page.locator('div').filter({ hasText: /^You need to verify ownership of the URL before you can claim any tips\.$/ }).getByRole('button').click();
    await expect(page.getByRole('heading')).toContainText('Verify your URL');
    await eyes.check('Verify your URL', Target.window().matchLevel(MatchLevel.Layout));
    await page.getByRole('button', { name: 'OK' }).click();
    // No tips claim
    await page.getByLabel('Claim tips from this URL:').fill('superhero.com');
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForTimeout(500);
    // Timeout is set because tipping backend might have problems with response
    await expect(page.locator('//span[@class="claimed"]')).toContainText('Claim request sent!', ({ timeout: 25000 }));
    await page.getByRole('button', { name: 'OK' }).click();
  });

  test('SH Wallet_rst_more_reportBug', async ({ context, page }) => {
    // Open new tab with bug report possibility
    // Open Wallet settings

    await page.locator('//a[@data-cy="page-more"]').click();
    // Open Report Bug site
    await page.getByRole('link', { name: 'Report a bug' }).click();
    // Check new tab opening and content
    await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('heading', { name: 'Report to us – we are listening' }).isVisible()]);
    // Eyes check of new tab
  });

  test('SH Wallet_rst_more_superheroDex', async ({ context, page }) => {
    // Open Wallet settings

    await page.locator('//a[@data-cy="page-more"]').click();
    // Open Superhero DEX
    await page.getByRole('link', { name: 'Superhero DEX' }).click();
    await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Connect Wallet' }).isVisible()]);
  });

  test('SH Wallet_rst_more_about', async ({ page }) => {
    // Check Terms of Use and Privacy Policy screens
    // Open Wallet settings

    await page.locator('//a[@data-cy="page-more"]').click();
    // Open About screen
    await page.locator('a').filter({ hasText: 'About' }).click();
    await expect(page.locator('#app-wrapper')).toContainText('Superhero Wallet');
    // Open Terms and Conditions screen
    await page.locator('a').filter({ hasText: /^Terms$/ }).click();
    // Take a whole screenshot of the terms
    await expect(page.getByText('Connected')).not.toBeVisible();
    await eyes.check('Terms screen', Target.region(page.locator('//ion-content[@data-cy="terms-of-service"]')).fully());
    await page.getByTestId('back-arrow').click();
    // Open Privacy screen
    await page.locator('a').filter({ hasText: 'Privacy' }).click();
    // Take a whole screenshot of the privacy text
    await eyes.check('Privacy screen', Target.region(page.locator('//ion-content[@data-cy="privacy-policy"]')).fully());
    await page.getByTestId('btn-close').click();
  });

  test('SH Wallet_rst_more_gift_cards', { tag: '@sequence' }, async ({ page }) => {
    // Gift card creation screen check

    const giftCardAmount = 1;
    await switchToTestnet(page, expect);
    // Open Wallet settings
    await page.locator('//a[@data-cy="page-more"]').click();
    // Open Gift card screen
    await page.locator('//a[@data-cy="invite"]').click();
    await page.getByTestId('input').fill(giftCardAmount.toString());
    await page.getByRole('button', { name: 'Generate gift card' }).click();
    await expect(page.getByTestId('loader')).not.toBeVisible({ timeout: 15000 });
    // Check created gift card
    await expect(page.locator('#app-wrapper')).toContainText('Gift cards');
    await eyes.check('New Gift card', Target.window().matchLevel(MatchLevel.Layout));
    // Invite link
    await expect(page.locator('//span[@class="invite-link-url"]')).toContainText('https://wallet.superhero.com/invite');
    await expect(page.locator('//span[@class="token-amount"]//span[@class="amount"]')).toContainText(giftCardAmount.toString());

    // Top up created gift card
    await page.getByRole('button', { name: 'Top up' }).click();
    await eyes.check('Top up gift card', Target.region(page.locator('//div[@class="ion-page can-go-back"]//ion-content[@class="md content-ltr ion-padding ion-content-bg"]')).fully().matchLevel(MatchLevel.Layout));
    await page.getByTestId('input').nth(1).fill(giftCardAmount.toString());
    await page.getByRole('button', { name: 'Top up' }).click();
    // Claim back gift card amount
    await page.getByRole('button', { name: 'Claim Back' }).click();
    // Check that the gift card has no amount
    await page.waitForTimeout(1000);
    await expect(page.locator('//div[@class="invite-info"]//span[@class="token-amount"]//span[@class="amount"]')).toContainText('0 AE');
    // Delete empty gift card
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.locator('//div[@class="generated-links"]//p[@class="section-title"]')).toBeHidden();
  });

  test('SH Wallet_rst_more_faucet', async ({ page }) => {
    // Use of aeternity faucet

    await switchToTestnet(page, expect);
    // Open Account details page
    await page.getByTestId('account-card-base').first().click();
    const page1Promise = page.waitForEvent('popup');
    await page.getByRole('link', { name: 'Faucet' }).click();
    // Will open Faucet in new browser tab
    const page1 = await page1Promise;
    await expect(page1.locator('h1')).toContainText('Æternity Blockchain\'s Faucet Aepp');
    await page.locator('//div[@class="account-info-wrapper"]//button').click();
    await page1.getByRole('button', { name: 'Top UP' }).click();
    await expect(page1.locator('//div[@id="result"]')).not.toContainText('Adding');
    // Take the time to wait for next faucet possible use.
    const faucetMsg = page1.locator('//div[@id="result"]');
    const faucetMsgText = await faucetMsg.textContent() as string;
    const faucetRemainingTime = faucetMsgText.slice(faucetMsgText.indexOf('another') + 7, faucetMsgText.lastIndexOf('Please') - 1);
    // Check if faucet was used recently
    if ((await page1.locator('//div[@id="result"]').innerText()).includes('Something went wrong') === false) {
      await expect(page1.locator('//div[@id="result"]')).toContainText('Added 5 AE!');
      console.log('5 ae has been added to account.');
      await page1.getByRole('button', { name: 'Top UP' }).click();
      await expect(page1.locator('//div[@id="result"]')).toContainText('Something went wrong. ');
    } else {
      console.log(`Faucet was already used. Blocked for ${faucetRemainingTime}`);
    }
  });

  test('SH Wallet_rst_send_funds', { tag: '@sequence' }, async ({ page }) => {
    // Send funds to second wallet account via account address, add payload text.

    await switchToTestnet(page, expect);
    // Open send and make transaction
    await page.getByRole('button', { name: 'Send assets to others' }).click();
    await page.locator('//textarea[@data-cy="textarea"]').fill(secAeAccAddress);
    await page.locator('//input[@name="amount"]').fill(txnValue.toString());
    // Read txn fee value
    await page.waitForTimeout(3000);
    const txnFeeValueStr = await page.locator('//span[@data-cy="review-fee"]//span[@class="amount"]').textContent() as string;
    const txnFeeValue = parseFloat(txnFeeValueStr);
    await page.locator('//button[@data-cy="next-step-button"]').click();
    await page.waitForTimeout(500);
    await eyes.check('Review transaction', Target.window().fully());

    // Go back check values for editing
    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.locator('//textarea[@data-cy="textarea"]')).toHaveValue(secAeAccAddress);
    await expect(page.locator('//input[@name="amount"]')).toHaveValue(txnValue.toString());
    await page.waitForTimeout(5000);
    await page.locator('//button[@data-cy="next-step-button"]').click();

    // Open Review transaction screen. Check address and ae amounts
    await expect(page.locator('#app-wrapper')).toContainText(aeAccAddress);
    await expect(page.locator('#app-wrapper')).toContainText(secAeAccAddress);
    await expect(page.getByTestId('review-amount')).toContainText(`${txnValue.toString()} AE`);
    await page.waitForTimeout(500);
    await expect(page.locator('//div[@class="transfer-review-base transfer-review"]//span[@data-cy="review-fee"]//span[@class="amount"]')).toContainText(txnFeeValueStr);
    // Get the total amount of transaction amount + transaction fee
    let totalAmount = 0;
    totalAmount = txnValue + txnFeeValue;
    // Check total amount
    await page.waitForTimeout(800);
    await expect(page.locator('//span[@data-cy="review-total"]//span[@class="amount"]'))
      .toContainText(totalAmount.toString());
    // Send transaction
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    // If the loader takes longer then 10 sec to show, check if loader is visible
    if (await page.locator('//div[@class="panel-body"]').isVisible({ timeout: 10000 }) === true) {
      // Check the Latest Transaction widget if send txn is shown
      await expect(page.locator('//div[@class="panel-body"]')).toContainText('Sent', { timeout: 8000 });
      await expect(page.getByRole('link', { name: `æternity æternity − ${totalAmount.toString()} AE` }).first()).toBeVisible({ timeout: 8000 });
    } else {
      console.log('SH Wallet_rst_send_funds- loader is visible!');
    }
  });

  test('SH Wallet_rst_send_funds_chain_name_payload', { tag: '@sequence' }, async ({ page }) => {
    // Send funds to second wallet account via chain name, add payload text.

    await switchToTestnet(page, expect);
    // Open send and make transaction
    await page.getByRole('button', { name: 'Send assets to others' }).click();
    await page.locator('//label[@data-cy="input-wrapper"]//textarea[@data-cy="textarea"]').fill(secAeAccChainName);
    await page.locator('//input[@name="amount"]').fill(txnValue.toString());
    // Add payload
    await page.getByRole('button', { name: 'Payload' }).click();
    await page.locator('//label[@data-cy="input-wrapper"]//textarea').nth(1).fill('test text');
    await page.getByRole('button', { name: 'Done' }).click();
    // Read txn fee value
    await page.waitForTimeout(3000);
    const txnFeeValueStr = await page.locator('//span[@data-cy="review-fee"]//span[@class="amount"]').textContent() as string;
    const txnFeeValue = new BigNumber(txnFeeValueStr.slice(0, -3));
    const totalAmount = txnFeeValue.plus(txnValue).toString();
    // Check payload value
    await expect(page.locator('//div[@class="payload-text"]')).toContainText('test text');
    await page.locator('//button[@data-cy="next-step-button"]').click();
    await eyes.check('Review transaction', Target.window().matchLevel(MatchLevel.Layout));
    // Open Review transaction screen. Check address and ae amounts
    await expect(page.locator('//div[@data-cy="review-recipient"]/div[@class="value"]/div[@class="avatar-with-chain-name only-name"]//div[@class="chain-name"]'))
      .toContainText(secAeAccChainName);
    await expect(page.locator('//div[@class="transfer-review-base transfer-review"]//span[@data-cy="review-fee"]//span[@class="amount"]')).toContainText(txnFeeValueStr);
    await expect(page.locator('//span[@data-cy="review-total"]//span[@class="amount"]')).toContainText(totalAmount);
    // Go back and check values for editing
    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.locator('//textarea[@data-cy="textarea"]')).toHaveValue(secAeAccChainName);
    await expect(page.locator('//input[@name="amount"]')).toHaveValue(txnValue.toString());
    await page.locator('//input[@name="amount"]').fill(txnValue.toString());
    await page.locator('//button[@data-cy="next-step-button"]').click();
    // Send transaction
    await page.getByRole('button', { name: 'Send', exact: true }).click();
  });

  test('SH Wallet_rst_send_funds_qr_scan', async ({ page }) => {
    // Check the appearance of QR code in send funds modal

    await switchToTestnet(page, expect);
    // Open send and make transaction
    await page.getByRole('button', { name: 'Send assets to others' }).click();
    await page.getByTestId('scan-button').click();
    await page.waitForTimeout(600);
    await expect.soft(page.locator('//div[@class="title"]')).toContainText('Scan the recipient’s account address QR code in order to send æternity to them.');
    await eyes.check('Scan QR code page', Target.window().matchLevel(MatchLevel.Layout));
    await page.getByTestId('btn-close').nth(1).click();
  });

  test('SH Wallet_rst_faucet_missing_mainnet', async ({ page }) => {
    // Check on Mainnet if Faucet is not available

    await page.getByTestId('account-card-base').first().click();
    await expect(page.getByRole('link', { name: 'Faucet' })).not.toBeVisible();
    await page.getByTestId('btn-close').click();
    await page.locator('//a[@data-cy="page-more"]').click();
    await expect(page.getByRole('link', { name: 'Faucet' })).not.toBeVisible();
  });

  test('SH Wallet_rst_add ae acc_testnet', async ({ page }) => {
    // Add a new aeternity account

    await switchToTestnet(page, expect);
    await page.locator('//*[local-name()="svg" and @data-cy="bullet-switcher-add"]').click();
    await page.getByTestId('account-card-add').click();
    await eyes.check('Add account', Target.window().fully());
    await page.getByTestId('btn-add-aeternity').click();
    await eyes.check('Blockchain selector', Target.window().fully());
    await page.getByTestId('create-plain-account').last().click();
    // await eyes.check('Add aeternity account', Target.window().fully());

    // TODO Add check to see if new account was added
  });

  test('SH Wallet_rst_ae_details_testnet', async ({ page }) => {
    // Check coin details screen

    await switchToTestnet(page, expect);
    await page.getByTestId('account-card-base').first().click();
    await page.getByTestId('account-details-assets').click();
    await page.locator('//a[starts-with(@href, "/coins/aeternity")]').click();
    await expect(page.getByText('Connected')).not.toBeVisible();
    await expect(page.getByTestId('loader')).not.toBeVisible();
    await eyes.check('AE details txn', Target.window().matchLevel(MatchLevel.Layout));
    // Check In filter
    await page.getByRole('button', { name: 'In' }).click();
    await page.locator('//div[@class="label"]//span[text()="Received "]').nth(1).scrollIntoViewIfNeeded();
    await expect(page.getByTestId('list')).toContainText('Received');
    await expect(page.getByTestId('list')).not.toContainText('Sent');
    // Check Out filter
    await page.getByRole('button', { name: 'Out' }).click();
    await page.locator('//div[@class="label"]//span[text()="Sent "]').nth(1).scrollIntoViewIfNeeded();
    await expect(page.getByTestId('list')).toContainText('Sent');
    await expect(page.getByTestId('list')).not.toContainText('Received');
    // Check All filter
    await page.getByRole('button', { name: 'All' }).click();
    await expect(page.getByTestId('list')).toContainText('Sent');
    await expect(page.getByTestId('list')).toContainText('Received');
    // Check Coin details tab under Con details
    await page.locator('//a[starts-with(@href, "/coins/aeternity/details")]').click();
    await eyes.check('AE details details', Target.window().matchLevel(MatchLevel.Layout));
    await page.getByTestId('btn-close').click();
  });

  // MULTI SIG

  test('SH Wallet_rst_multisig_creation screen_testnet', async ({ page }) => {
    await switchToTestnet(page, expect);
    await page.getByTestId('bullet-switcher-add').click();
    await page.getByTestId('account-card-add').click();
    await page.getByTestId('btn-add-aeternity').click();
    await page.getByRole('button', { name: 'Create multisig vault Manage' }).click();
    // Select signer 1
    await page.locator('label').filter({ hasText: 'Signer\'s account address' }).click();
    await page.locator('//div[@class="account-details list-name"]').first().click();
    // Add signer help text
    await page.locator('//div[@class="signers-add-wrapper"]//button[@class="btn-help button-plain btn-help"]').click();
    await expect(page.locator('#app-wrapper')).toContainText('Authorized signers');
    await eyes.check('Authorized signer text', Target.window().fully());
    await page.getByRole('button', { name: 'OK' }).click();
    // Consensus required help
    await page.getByTestId('multisig-num-of-signers-selector-help').click();
    await expect(page.locator('//h2').nth(1)).toContainText('Consensus required');
    await eyes.check('Consensus required text', Target.window().fully());
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByRole('button', { name: 'Create multisig vault', exact: true })).toBeDisabled();
    // Add signer
    await page.locator('//div[@data-signer-idx="signer-address-1"]//textarea').fill(secAeAccAddress);
    // Signer 3 should be visible
    await page.locator('//div[@class="signers-add-wrapper"]//button').first().click();
    await page.locator('//div[@data-signer-idx="signer-address-2"]//textarea').click();
    await page.locator('//div[@data-signer-idx="signer-address-1"]//textarea').click();
    await expect(page.getByTestId('input-message')).toContainText('This field is required');
    // Consensus required for tx confirmation should have 3 signers
    await expect(page.locator('//div[@class="signers-count"]//span[@class="text-emphasis"]')).toHaveText('3');
    // Remove added signer
    await page.locator('//div[@data-signer-idx="signer-address-2"]//label//button').click();
    await expect(page.locator('//div[@class="signers-count"]//span[@class="text-emphasis"]')).toHaveText('2');
  });

  // Creating to many multisigs will result in all test failing due to heavy load
  test.skip('SH Wallet_rst_multisig_creation_testnet', { tag: '@sequence' }, async ({ page }) => {
    await switchToTestnet(page, expect);
    await page.getByTestId('bullet-switcher-add').click();
    await page.getByTestId('account-card-add').click();
    await page.getByTestId('btn-add-aeternity').click();
    await page.getByRole('button', { name: 'Create multisig vault Manage' }).click();
    // Select signer 1
    await page.locator('label').filter({ hasText: 'Signer\'s account address' }).click();
    await page.locator('//div[@class="account-details list-name"]').click();
    // Enter signer 2 address
    await page.locator('//textarea[@data-cy="textarea"]').fill(secAeAccAddress);
    // Select only 1 of 2 Signers
    await page.locator('//div[@data-cy="multisig-num-of-signers-selector"]//select[@class="number-select-input"]').selectOption('1');
    // Select create button
    await page.locator('//div[@class="fixed-screen-footer multisig-vault-create"]/button').click();
    await page.waitForTimeout(1000);
    await expect(page.getByText('Creating account (pays for the transaction)')).toBeVisible();
    await eyes.check('Create new multisig vault', Target.window().fully());
    await page.getByRole('button', { name: 'Advanced transaction details' }).click();
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(page.getByText('Authorized signers')).toBeVisible();
    // TODO Add variable for account address
    await expect(page.getByRole('link', { name: 'ak_2sr ··· 2TL' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'ak_2Ek ··· Up9' })).toBeVisible();
    await page.getByRole('button', { name: 'Create vault' }).click();
    await page.waitForTimeout(200);
    await expect(page.getByText('It\'s ready! Your new multisig vault is added to Superhero wallet.')).toBeVisible({ timeout: 15000 });
    await eyes.check('Creating vault progress', Target.window().matchLevel(MatchLevel.Layout));
    // Open confirmation screen
    await page.getByRole('button', { name: 'Go to multisig vault' }).click();
    // Multisig vaults details screen is opening after successful creation
    await expect(page.locator('//div[text()="Multisig vault address "]')).toBeVisible();
    await eyes.check('Created vault details', Target.region(page.locator('//div[@class="multisig-details"]/parent::ion-content')).fully());
  });

  test('SH Wallet_rst_multisig acc_testnet', async ({ page }) => {
    await switchToTestnet(page, expect);
    await page.getByRole('button', { name: 'Show multisig vaults' }).click();
    await revokePendingProposal(page, expect);
    // Check Show multisig screen
    await expect(page.locator('//span[text()="ak_2Mw"]')).toBeVisible({ timeout: 12000 });
    await expect.soft(page.getByText('Total in multisig vaults')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Receive to multisig vault' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Propose Tx to other signers' })).toBeVisible();
    await eyes.check('Multisig vault acc screen', Target.window().fully());
    // Select current multisig account
    await page.locator('//a[@data-cy="account-card-base"]//div[text()="Multisig vault"]').nth(0).click();
    // Check receive screen
    await page.waitForTimeout(1000);
    await page.locator('//div[@class="horizontal-scroll buttons"]//button[@data-cy="receive"]').click();
    await expect(page.locator('//div[@data-cy="top-up-container"]//h2')).toContainText('Receive funds to multisig vault');
    await expect(page.getByText('Request specific amount (optional)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
    await page.locator('//button[@data-cy="copy"]').click();
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
    await eyes.check('Multisig receive', Target.window().fully());
    await page.getByTestId('btn-close').nth(1).click();
    // Check propose txn screen
    await page.locator('//div[@class="horizontal-scroll buttons"]//button[@data-cy="send"]').click();
    await eyes.check('Propose Txn screen', Target.window().fully());
    await page.getByTestId('btn-close').nth(1).click();
    // Open details tab
    await page.getByTestId('multisig-account-details-info').click();
    await expect(page.getByText('Authorized signers ')).toBeVisible();
    await eyes.check('Multisig details tab', Target.region(page.locator('//div[@class="multisig-details"]/parent::ion-content')).fully());
    await page.locator('//div[text()="Consensus "]//button').click();
    // Open Multisig consensus help screen
    await expect(page.getByRole('heading', { name: 'Multisig consensus' })).toBeVisible();
    await eyes.check('Multisig consensus help text', Target.window().fully());
    await page.getByRole('button', { name: 'ok' }).click();
  });

  test('SH Wallet_rst_multisig_receive screen_testnet', async ({ page }) => {
    await switchToTestnet(page, expect);
    // Go to Multisig vaults
    await page.getByRole('button', { name: 'Show multisig vaults' }).click();
    // Select current multisig account
    await revokePendingProposal(page, expect);
    await page.locator('//a[@data-cy="account-card-base"]//div[text()="Multisig vault"]').nth(0).click();
    // Check receive screen
    await expect(page.locator('//span[text()="ak_2Mw"]')).toBeVisible({ timeout: 10000 });
    await page.locator('//div[@class="horizontal-scroll buttons"]//button[@data-cy="receive"]').click();
    await expect(page.getByRole('heading')).toContainText('Receive funds to multisig vault');
    // Enter some number into amount field so the link under QR code will be
    //  updated and the account address displayed without spaces
    await page.locator('//input[@data-cy="input"]').fill('1');
    await expect(page.getByText('Request specific amount (optional)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
    await eyes.check('Multisig receive', Target.window().matchLevel(MatchLevel.Layout));
    await page.locator('//button[@data-cy="copy"]').click();
    await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();
    // Take the account address from the QR code link
    const multisigAddressStr = await page.locator('//div[@class="address"]//span[text()]').textContent() as string;
    const multisigAddress = multisigAddressStr.slice(0, 53);
    // Link to aescan.io
    const page1Promise = page.waitForEvent('popup');
    await page.locator('//div[@class="address-truncated address"]').click();
    const page1 = await page1Promise;
    // Check on aeScan
    if (await page1.getByAltText('æScan logo').first().isVisible() === true) {
      console.assert(await page1.locator('//div[@class="copy-chip__text"]').nth(0).innerText() === multisigAddress);
    } else {
      console.log('aeScan was not available');
    }
    await page.getByTestId('btn-close').nth(1).click();
  });

  test('SH Wallet_rst_multisig_propose tx_screen_testnet', { tag: '@sequence' }, async ({ page }) => {
    // Propose z multisig transaction with 1/1 of 2 consensus and send

    await switchToTestnet(page, expect);
    // Go to Multisig vaults
    await page.getByRole('button', { name: 'Show multisig vaults' }).click();
    // Check if a transaction proposal is awaiting
    await revokePendingProposal(page, expect);
    // Check propose txn screen
    await expect(page.locator('//span[text()="ak_2Mw"]')).toBeVisible({ timeout: 15000 });
    await page.locator('//a[@data-cy="account-card-base"]//div[text()="Multisig vault"]').nth(0).click();
    await page.locator('//div[@class="horizontal-scroll buttons"]//span[text()="Propose Tx"]').click();
    await expect(page.getByRole('heading')).toContainText('Multisig transaction proposal', { timeout: 8000 });
    await eyes.check('Propose Txn', Target.window().matchLevel(MatchLevel.Layout));
    // Open Recipient help pop up, make screen check, close pop up
    await page.getByTestId('address').getByRole('button').first().click();
    await eyes.check('Recipient_help', Target.window().fully());
    await page.getByRole('button', { name: 'OK' }).click();

    // Check info/error msg
    // Missing receiver address
    await page.locator('//textarea[@data-cy="textarea"]').click();
    await page.locator('//input[@name="amount"]').click();
    await expect.soft(page.locator('//div[@data-cy="address"]//label[@data-cy="input-field-message"]'))
      .toContainText('This field is required');
    // Missing amount value
    await page.locator('//textarea[@data-cy="textarea"]').click();
    await expect(page.locator('//div[@data-cy="amount"]//label[@data-cy="input-field-message"]'))
      .toContainText('This field is required');
    // Incorrect address string
    await page.locator('//textarea[@data-cy="textarea"]').fill('12345678');
    await expect(page.locator('//div[@data-cy="address"]//label[@data-cy="input-field-message"]'))
      .toContainText('Invalid address or .chain name');
    // Send amount over max available
    await page.locator('//input[@name="amount"]').fill('12345678');
    await page.locator('//textarea[@data-cy="textarea"]').click();
    await page.waitForTimeout(600);
    await expect(page.locator('//div[@data-cy="amount"]//label[@data-cy="input-field-message"]'))
      .toContainText('Amount exceeds vault balance');
    // Send amount is 0
    await page.locator('//input[@name="amount"]').fill('0');
    await page.locator('//textarea[@data-cy="textarea"]').click();
    await expect(page.locator('//div[@data-cy="amount"]//label[@data-cy="input-field-message"]'))
      .toContainText('Amount must be more than 0.');
    // Open Payload help pop up, make screen check, close pop up
    await page.locator('//div[@class="payload-add-wrapper"]/button[@class="btn-help button-plain btn-help"]').click();
    await eyes.check('Payload_help', Target.window().fully());
    await page.getByRole('button', { name: 'OK' }).click();
    // Open Payload screen
    await page.getByRole('button', { name: 'Payload' }).click();
    await page.getByLabel('Payload message').fill('Hello. This is a test!');
    await eyes.check('Add_Payload', Target.window().fully());
    // Close Payload pop up
    await page.getByRole('button', { name: 'Done' }).click();
    // Fill out multisig txn proposal fields
    await page.locator('//div[@data-cy="address"]//textarea[@data-cy="textarea"]').fill(secAeAccAddress);
    await page.locator('//input[@name="amount"]').fill(txnValue.toString());
    // Check propose txn screen with payload message
    await eyes.check('Propose txn_Payload', Target.window().matchLevel(MatchLevel.Layout));
    // Click propose and approve button
    await page.getByTestId('next-step-button').click();
    await page.waitForTimeout(500);
    // Multisig transaction proposal screen
    await eyes.check('Multisig txn proposal', Target.region(page.locator('//div[@class="container"]')).fully());
    await page.getByTestId('next-step-button').click();
    // Confirm of reject screen
    await expect(page.locator('//span[text()="Multisig Tx proposal details"]')).toBeVisible({ timeout: 20000 });
    // Multisig Tx proposal details
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByRole('button', { name: 'Disapprove' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Revoke transaction proposal' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
    await page.waitForTimeout(1000);
    await eyes.check('Multisig Tx proposal', Target.region(page.locator('//div[@class="multisig-proposal-details"]/parent::ion-content')).fully());
    await page.getByRole('button', { name: 'Send' }).click();
    // Multisig Tx proposal details after sending
    await expect(page.getByTestId('loader')).not.toBeVisible({ timeout: 25000 });
    await expect(page.locator('//div[@class="consensus"]//div[@class="info-box success"]')).toContainText('Transaction has been successfully sent.', { timeout: 20000 });
    await page.waitForTimeout(500);
    await expect(page.locator('//div[@class="payload-text"]')).toContainText('Hello. This is a test!');
    await eyes.check('Multisig Tx proposal details', Target.region(page.locator('//div[@class="multisig-proposal-details"]/parent::ion-content')).fully());
  });

  test('SH Wallet_rst_multisig_propose_and_disapprove_screen_testnet', { tag: '@sequence' }, async ({ page }) => {
    // Propose z multisig transaction with 1/1 of 2 consensus and disapprove instead of sending

    await switchToTestnet(page, expect);
    // Go to Multisig vaults
    await page.getByRole('button', { name: 'Show multisig vaults' }).click();
    // Check if a transaction proposal is awaiting
    await revokePendingProposal(page, expect);
    // Select current multisig account
    await expect(page.locator('//span[text()="ak_2Mw"]')).toBeVisible({ timeout: 10000 });
    await page.locator('//a[@data-cy="account-card-base"]//div[text()="Multisig vault"]').nth(0).click();
    // Check propose txn screen
    await page.locator('//div[@class="horizontal-scroll buttons"]//span[text()="Propose Tx"]').click();
    await expect(page.getByRole('heading')).toContainText('Multisig transaction proposal');
    // Fill out multisig txn proposal fields
    await page.locator('//textarea[@data-cy="textarea"]').fill(secAeAccAddress);
    await page.locator('//input[@name="amount"]').fill(txnValue.toString());
    // Click propose and approve button
    await page.getByTestId('next-step-button').click();
    // Multisig transaction proposal screen
    await page.getByTestId('next-step-button').click();
    // Confirm of reject screen
    await expect(page.locator('//span[text()="Multisig Tx proposal details"]')).toBeVisible({ timeout: 20000 });
    // Multisig Tx proposal details
    await expect(page.getByRole('button', { name: 'Disapprove' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Revoke transaction proposal' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
    // Disapprove the txn proposal
    await page.getByRole('button', { name: 'Disapprove' }).click();
    // Disapprove pop up
    await expect(page.locator('//h2')).toContainText('Disapprove transaction proposal');
    await eyes.check('Disapprove transaction proposal', Target.window().matchLevel(MatchLevel.Strict));
    await page.getByTestId('to-confirm').click();
    // await page.locator('//button[@data-cy="accept"]').click();
  });

  test('SH Wallet_rst_multisig_propose_and_revoke_testnet', { tag: '@sequence' }, async ({ page }) => {
    // Propose z multisig transaction with 1/1 of 2 consensus and revoke transaction proposal

    await switchToTestnet(page, expect);
    // Go to Multisig vaults
    await page.getByRole('button', { name: 'Show multisig vaults' }).click();
    // Check if a transaction proposal is awaiting
    await revokePendingProposal(page, expect);
    // Select current multisig account
    await expect(page.locator('//span[text()="ak_2Mw"]')).toBeVisible({ timeout: 12000 });
    await page.locator('//a[@data-cy="account-card-base"]//div[text()="Multisig vault"]').nth(0).click();
    // Check propose txn screen
    await page.locator('//div[@class="horizontal-scroll buttons"]//span[text()="Propose Tx"]').click();
    await expect(page.getByRole('heading')).toContainText('Multisig transaction proposal');
    // Fill out multisig txn proposal fields
    await page.locator('//textarea[@data-cy="textarea"]').fill(secAeAccAddress);
    await page.locator('//input[@name="amount"]').fill('0.00001');
    // Click propose and approve button
    await page.getByTestId('next-step-button').click();
    // Multisig transaction proposal screen
    await page.getByTestId('next-step-button').click();
    // Confirm of reject screen
    await page.waitForTimeout(1500);
    await expect(page.locator('//span[text()="Multisig Tx proposal details"]')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('loader')).not.toBeVisible({ timeout: 15000 });
    // Multisig Tx proposal details
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByRole('button', { name: 'Disapprove' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Revoke transaction proposal' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
    // Revoke the txn proposal
    await page.getByRole('button', { name: 'Revoke transaction proposal' }).click();
    // Revoke pop up
    await expect(page.locator('//h2')).toContainText('Revoke transaction proposal');
    await eyes.check('Revoke transaction proposal', Target.window().fully());
    await page.getByTestId('to-confirm').click();
  });
  // Registering a name is a long operation and it will make other operation stuck
  // until we will implement the nonce handling on our side, or sdk will improve it
  test('SH Wallet_rst_names_register', { tag: '@sequence' }, async ({ page }) => {
    await switchToTestnet(page, expect);
    await page.getByTestId('account-card-base').first().click();
    await page.getByRole('link', { name: 'Assets' }).click();
    await expect(page.locator('//div[@class="account-details-tokens"]//span[text()="æternity"]')).toBeVisible();
    await page.waitForTimeout(500);
    await page.getByRole('link', { name: 'Names' }).click();
    await page.waitForTimeout(800);
    // Skip the test if a name is alreadt pending
    if (await page.locator('//span[@class="pending"]').isVisible()) {
      console.log('Name registering is pending. Skipping the test.');
    } else {
      const newChainName = genRandomString('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 63);
      // This waitForTimeout is required since the ionic routing
      // is failing switching to a new route that fast.
      await page.waitForTimeout(800);
      await page.locator('//div[@class="account-details-navigation"]//a[text()="Register name"]').click();
      await page.getByLabel('.chain').fill(newChainName);
      await page.waitForTimeout(600);
      await expect(page.locator('//div[@class="claim"]//button[contains(@class,"btn-register")]')).toBeEnabled();
      await page.waitForTimeout(5000);
      await page.locator('//div[@class="claim"]//div[@class="label-text"]').focus();
      await page.locator('//div[@class="claim"]//button').nth(1).click();
      await page.locator('//button[@data-cy="accept"]').click();
      await page.locator('//button[@data-cy="accept"]').click({ timeout: 20000 });
      // Chosen chain name should appear in the Names list with status pending
      await expect(page.getByText(newChainName)).toBeVisible({ timeout: 25000 });
      await expect(page.locator('//div[@class="pending"]')).toBeVisible();
      // Currently the pending status take very long
      //  await expect.soft(page.locator('//span[text()="Name update successful!"]'))
      // .toBeVisible({ timeout: 10000 });
    }
  });

  test('SH Wallet_rst_move_up_btn', { tag: ['@functional'] }, async ({ page }) => {
    // Open a transaction list and scroll down the list so the move up button

    await switchToTestnet(page, expect);
    await page.getByTestId('account-card-base').first().click();
    await page.locator('//div[@data-cy="list"]//a').isVisible();
    await page.waitForTimeout(2000);
    await page.locator('//div[@data-cy="list"]//a').last().focus();
    await expect(page.locator('//div[@class="back-to-top-btn-container"]//button')).toBeVisible();
    await page.locator('//div[@class="back-to-top-btn-container"]//button').click();
  });

  test('SH Wallet_rst_acc_counter', async ({ page }) => {
    // Checking account counter which does appear >=6 accounts

    await switchToTestnet(page, expect);
    let x = 2;
    // Create 4 aeternity accounts in a loop
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 4; i++) {
      await addAeternityAccount(page);
      await expect(page.getByTestId('account-name-number').last()).toContainText(`æternity account ${x += 1}`);
    }
    // Check if account counter is now visible and take screenshot for eyes
    await expect(page.locator('//div[@class="account-number"]')).toBeVisible();
    await expect(page.locator('//div[@class="account-number"]')).toContainText('6 / 6');
    await eyes.check('Account counter', Target.window().fully());
    await page.locator('//div[@class="account-number"]').click();
    await eyes.check('Account counter list', Target.window().fully());
    await page.getByTestId('btn-close').click();

    // Adding ETH account
    await addEthereumAccount(page, expect);
    await expect(page.locator('//div[@class="account-number"]')).toContainText('7 / 7');
    await page.locator('//div[@class="account-number"]').click();
    await eyes.check('Account counter list with ETH', Target.window().fully());
    await page.getByTestId('btn-close').click();

    // Add BTC account
    await addBitcoinAccount(page, expect);
    await expect(page.locator('//div[@class="account-number"]')).toContainText('8 / 8');
    await page.locator('//div[@class="account-number"]').click();
    await eyes.check('Account counter list with BTC', Target.window().fully());
  });

  test('SH Wallet_rst_ae_send_no_balance_for_txn_fee', { tag: ['@functional'] }, async ({ page }) => {
    // Account has less amount then the transaction fee

    await switchToTestnet(page, expect);
    // Create 3 AE accounts in a loop
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 3; i++) {
      await addAeternityAccount(page);
    }
    // Open send and make transaction
    await page.getByRole('button', { name: 'Send assets to others' }).click();
    await page.locator('//textarea[@data-cy="textarea"]').fill(secAeAccAddress);
    await page.locator('//input[@name="amount"]').fill('12');
    // As the mainnet account does not have any coins, the error message will be different
    await expect(page.locator('//div[@data-cy="amount"]//label[@data-cy="input-field-message"]'))
      .toContainText('AE balance is not enough to pay for transaction fee', { timeout: 10000 });
  });

  test('SH Wallet_rst_ae_airgap_account_import', async ({ page }) => {
    // Check AirGap functionality screens
    await switchToTestnet(page, expect);
    await page.getByTestId('bullet-switcher-add').click();
    await page.getByTestId('account-card-add').click();
    await page.getByTestId('btn-add-aeternity').click();
    await page.locator('//button[@header="Import AirGap accounts"]').click();
    await eyes.check('Import account from AirGap', Target.window().fully());
    // Check scan functionality availability
    await page.getByTestId('scan-button').click();
    await expect(page.locator('//div[text()="Scan QR code"]')).toBeVisible();
    await page.getByTestId('btn-close').last().click();
    await page.getByTestId('input-wrapper').fill('2LpfcPxwkWDgnKsCXYUkxBtFPjZg8YD5DWqcLx8UjMnFWjpSVMbiVquMkCGQp66Xc7cVi2uV6Vr7hSAiD564Dxgt3tNimE2EyrWyasZQwH7uYprwkEuKhgqFAnLgY4Sg1sadtFskTyyZp4yJFZPqmCmY');
    await page.waitForTimeout(1000);
    await eyes.check('Imported AirGap account', Target.window().fully());
    await page.getByRole('button', { name: 'Import Account' }).last().click();
    await expect(page.locator('//div[@data-cy="account-name-number"]').last())
      .toContainText('AirGap account 1', { timeout: 8000 });
    await eyes.check('AirGap account 1', Target.window().fully());
    await page.locator('//div[@data-cy="account-name-number"]').last()
      .getByText('AirGap account 1').click();
    await expect(page.getByRole('button', { name: 'Key' })).not.toBeVisible();
    await page.waitForTimeout(500);
    // Check Send modal for AirGap account
    await page.locator('//button[@data-cy="send"]').last().click();
    await expect(page.locator('//h2[text()="Send funds from AirGap account"]')).toBeVisible();
    await page.locator('//textarea[@data-cy="textarea"]').fill(aeAccAddress);
    await page.locator('//input[@name="amount"]').fill('1');
    await page.locator('//button[@data-cy="next-step-button"]').click();
    await expect(page.locator('//div[@class="custom-header-title"]'))
      .toContainText('Sign transaction');
    await page.waitForTimeout(2000);
    await page.locator('//div[@class="custom-header-title" and contains(text(),"Sign transaction")]//button[@class="btn-help button-plain btn-help"]').click();
    await eyes.check('Sign AirGap help', Target.region(page.locator('//div[@class="container"]').nth(1)).fully());
    await page.getByRole('button', { name: 'OK' }).click();
    await page.waitForTimeout(800);
    await eyes.check('Sign transaction details', Target.region(page.locator('//div[@class="container"]')).fully());
    await page.locator('//button[@data-cy="next-step-button"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('//div[@class="custom-header-title"]'))
      .toContainText('Broadcast transaction');
    await eyes.check('Broadcast transaction', Target.window().fully());
  });

  test('SH Wallet_rst_ae_share_account_address', async ({ page }) => {
    // Check Share screen

    await switchToTestnet(page, expect);
    // Open Account details screen
    await page.getByTestId('account-card-base').first().click();
    await page.locator('//button[@data-cy="share-address"]').click();
    await eyes.check('Share your public address', Target.window().fully());
    await page.getByTestId('btn-close').nth(1).click();
  });

  test('SH Wallet_rst_ae_address_book', async ({ page }) => {
    // Check Address book screens

    await page.locator('//a[@data-cy="page-more"]').click();
    await eyes.check('Address book', Target.window().fully());
    // Open Address book
    await page.locator('a').filter({ hasText: 'Address book' }).click();
    await expect(page.locator('//div[@class="truncate text"]')).toContainText('Address book');
    // Add ae address
    await page.getByTestId('add-address').click();
    await eyes.check('add address screen', Target.window().fully());
    await page.locator('//div[@data-cy="name"]//textarea').fill('ae test name');
    await page.locator('//div[@data-cy="address"]//textarea').fill(secAeAccAddress);
    await page.waitForTimeout(800);
    await eyes.check('ae test address', Target.window().fully());
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForTimeout(800);
    await expect(page.locator('//a[@data-cy="address-book-item" and @idx="0"]')).toContainText('ae test name');
    // Add BTC address
    await page.getByTestId('add-address').click();
    await page.locator('//div[@data-cy="name"]//textarea').fill('btc test name');
    await page.locator('//div[@data-cy="address"]//textarea').fill('bc1qkwagn38f4zv80wdlhw539vn7geyvsyaj79jejw');
    await page.waitForTimeout(800);
    await eyes.check('btc test address', Target.window().fully());
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.locator('//a[@data-cy="address-book-item" and @idx="1"]')).toContainText('btc test name');
    // Add ETH address
    await page.waitForTimeout(800);
    await page.getByTestId('add-address').click();
    await page.locator('//div[@data-cy="name"]//textarea').fill('eth test name');
    await page.locator('//div[@data-cy="address"]//textarea').fill('0x56eFaF7299AA9C7b3F7935f88908596A8b11a016');
    await page.waitForTimeout(800);
    await eyes.check('eth test address', Target.window().fully());
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.locator('//a[@data-cy="address-book-item" and @idx="2"]')).toContainText('eth test name');
    // Filter saved accounts
    await page.getByTestId('aeternity-filter').click();
    await expect(page.getByTestId('address-book-item')).toContainText('ae test name');
    await expect(page.locator('//div[@class="address-book-item"]//span[text()="eth test name"]')).not.toBeVisible();
    await expect(page.locator('//div[@class="address-book-item"]//span[text()="btc test name"]')).not.toBeVisible();
    await page.getByTestId('bitcoin-filter').click();
    await expect(page.getByTestId('address-book-item')).toContainText('btc test name');
    await expect(page.locator('//div[@class="address-book-item"]//span[text()="eth test name"]')).not.toBeVisible();
    await expect(page.locator('//div[@class="address-book-item"]//span[text()="ae test name"]')).not.toBeVisible();
    await page.getByTestId('ethereum-filter').click();
    await expect(page.getByTestId('address-book-item')).toContainText('eth test name');
    await expect(page.locator('//div[@class="address-book-item"]//span[text()="btc test name"]')).not.toBeVisible();
    await expect(page.locator('//div[@class="address-book-item"]//span[text()="ae test name"]')).not.toBeVisible();
    await page.getByTestId('all-filter').click();
    await expect(page.locator('//a[@data-cy="address-book-item" and @idx="0"]')).toContainText('ae test name');
    await expect(page.locator('//a[@data-cy="address-book-item" and @idx="1"]')).toContainText('btc test name');
    await expect(page.locator('//a[@data-cy="address-book-item" and @idx="2"]')).toContainText('eth test name');
    // Remove added address
    await page.locator('//a[@data-cy="address-book-item" and @idx="0"]').click();
    await page.getByRole('button', { name: 'Delete address record' }).click();
    await page.waitForTimeout(800);
    await expect(page.locator('//div[@class="address-book-item"]//span[text()="ae test name"]')).not.toBeVisible();
  });

  test('SH Wallet_rst_ae_address_book_send', async ({ page }) => {
    // Check Address book screen in send modal

    await page.locator('//a[@data-cy="page-more"]').click();
    // Open Address book
    await page.locator('a').filter({ hasText: 'Address book' }).click();
    // Add ae address
    await page.getByTestId('add-address').click();
    await page.locator('//div[@data-cy="name"]//textarea').fill('ae test name');
    await page.locator('//div[@data-cy="address"]//textarea').fill(secAeAccAddress);
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.getByTestId('btn-close').click();
    // Open send screen
    await page.getByRole('button', { name: 'Send assets to others' }).click();
    await page.getByTestId('address-book-button').click();
    await eyes.check('Select recipient address', Target.window().fully());
    await page.locator('//button[@data-cy="address-book-item" and @idx="0"]').click();
    await page.waitForTimeout(1500);
    await expect(page.locator('//div[@class="address-truncated"]').last()).toContainText(secAeAccAddress.substring(0, 6));
  });

  test('SH Wallet_rst_ae_address_book_send_dropdown', async ({ page }) => {
    // Check Address book screen in send modal

    await page.locator('//a[@data-cy="page-more"]').click();
    // Open Address book
    await page.locator('a').filter({ hasText: 'Address book' }).click();
    // Add ae address
    await page.getByTestId('add-address').click();
    await page.locator('//div[@data-cy="name"]//textarea').fill('ae test name');
    await page.locator('//div[@data-cy="address"]//textarea').fill(secAeAccAddress);
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.getByTestId('btn-close').click();
    // Open send screen
    await page.getByRole('button', { name: 'Send assets to others' }).click();
    await page.locator('//textarea[@data-cy="textarea"]').fill('test');
    await page.waitForTimeout(500);
    await page.getByText('ae test name').click();
    await expect(page.locator('//div[@class="address-truncated"]').last()).toContainText(secAeAccAddress.substring(0, 6));
  });

  test('SH Wallet_rst_import_key', async ({ page }) => {
    // Checking account counter which does appear >=6 accounts
    await switchToTestnet(page, expect);
    await page.getByTestId('bullet-switcher-add').click();
    await page.getByTestId('account-card-add').click();
    await page.getByTestId('btn-add-aeternity').click();
    await page.locator('//button[@header="Import with private key"]').click();
    await expect(page.locator('//div[@class="heading text-center"]')).toContainText('Import æternity account');
    // Account private key helper text
    await page.locator('//div[@data-cy="field-private-key"]//button').click();
    await eyes.check('Prvate Key helper', Target.window().fully());
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByPlaceholder('Enter or paste your private key here').fill('2602a31e7a3ce342a6f287ee10164cadb88fd16eaa883bd9b93a75f653be03322594d09b5907f8a6f1a9fd2c7e5b067720fe78d862e83b9d6a7ef0f0fb3173f2');
    await page.getByTestId('btn-import').click();
    await expect(page.locator('//div[@data-cy="account-name-number"]').last()).toHaveText('PK æternity account 1');
    await page.locator('//div[@data-cy="account-name-number"]').last().click();
    await page.locator('//div[@class="horizontal-scroll buttons"]//button[@data-cy="receive"]').click();
    await expect(page.getByRole('heading')).toContainText('Receive funds to public address');
  });

  test('SH Wallet_rst_import_ledger_account', async ({ page }) => {
    // Checking account counter which does appear >=6 accounts
    await switchToTestnet(page, expect);
    await page.getByTestId('bullet-switcher-add').click();
    await page.getByTestId('account-card-add').click();
    await page.getByTestId('btn-add-aeternity').click();
    await page.locator('//button[@header="Add Ledger accounts"]').click();
    await expect(page.locator('//h2')).toContainText('Connect Ledger device');
    await page.getByRole('button', { name: 'Connect' }).last().click();
    await eyes.check('Missing Ledger device', Target.window().fully());
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
