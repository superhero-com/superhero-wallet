/* eslint-disable no-console */
import { test, expect } from '@playwright/test';
import {
  Configuration,
  EyesRunner,
  Eyes,
  Target,
  MatchLevel,
} from '@applitools/eyes-playwright';
import { RestoreWalletData } from '../test-data/login.data';
import { interceptApiRequests, switchToTestnet, addEthereumAccount } from './commands';
import { initializeRunnerAndConfig } from './utils';

let Config: Configuration;
let Runner: EyesRunner;

const ethFaucetUrl = 'https://faucet.triangleplatform.com/ethereum/sepolia';

test.beforeAll(() => {
  [Config, Runner] = initializeRunnerAndConfig('ETH');
});

test.describe('SH Wallet checks', () => {
  let eyes: Eyes;

  const { ethAccAddress } = RestoreWalletData;

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

  test('SH Wallet_rst_add eth acc_testnet', async ({ page }) => {
    await switchToTestnet(page, expect);
    await page.getByTestId('bullet-switcher-add').click();
    await page.getByTestId('account-card-add').click();
    await eyes.check('Etherum', Target.window().fully());
    await page.getByTestId('btn-add-ethereum').click();
    await page.getByTestId('create-plain-account').last().click();
    await expect(page.getByTestId('account-name-number').last()).toContainText('Ethereum account');
    await eyes.check('Add ETH account', Target.window().matchLevel(MatchLevel.Strict));
  });

  test('SH Wallet_rst_receive eth_mainnet', async ({ page }) => {
    // Add ETH account to be visible
    await addEthereumAccount(page, expect);
    // Open Receive screen from Dashboard
    await page.getByTestId('receive').click();
    await page.getByTestId('btn-close').click();
    // Open Receive screen from Account details page
    await page.locator('//div[@data-cy="account-name-number"]').last().click();
    await page.locator('//div[@class="horizontal-scroll buttons"]/button[@data-cy="receive"]').click();
    // Check for elements
    await expect(page.getByRole('heading')).toContainText('Receive Ethereum to public address');
    await expect(page.getByText('Request specific amount')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();

    await page.locator('//button[@data-cy="copy"]').click();
    await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();
    await eyes.check('Receive_ETH', Target.window().matchLevel(MatchLevel.Strict));
    // Link to ETH explorer
    const page1Promise = page.waitForEvent('popup');
    await page.locator('//div[@class="address-truncated address"]').click();
    const page1 = await page1Promise;
    await page.waitForTimeout(800);

    if (await page1.locator('//header[@id="masterHeader"]').isVisible() === true) {
      console.assert(await page1.locator('//span[@id="mainaddress"]').nth(0).innerText() === ethAccAddress);
    } else {
      console.log('Etherscan was not available');
    }
  });

  test('SH Wallet_rst_eth_send_screen_mainnet', async ({ page }) => {
    // Add ETH account to be visible
    await addEthereumAccount(page, expect);

    // Open Send screen from dashboard
    await page.getByRole('button', { name: 'Send' }).click();
    await page.getByTestId('btn-close').click();
    // Open Send screen from Account details page
    await page.locator('//div[@data-cy="account-name-number"]').last().click();
    await page.locator('//div[@class="horizontal-scroll buttons"]/button[@data-cy="send"]').click();

    // Check Send main screen
    await expect(page.getByRole('heading', { name: 'Send Ethereum' })).toBeVisible();
    await page.waitForTimeout(600);
    await eyes.check('Send Ethereum', Target.window().matchLevel(MatchLevel.Strict));
    await expect(page.getByText('Estimated transaction fee ')).toBeVisible();
    await expect(page.getByText('Maximum transaction fee ')).toBeVisible();

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
      .toContainText('Invalid ethereum address');

    // Sender and receiver the same address
    await page.locator('//textarea[@data-cy="textarea"]').fill('0x22Fa8128467F549eD9eAd9Ae9b3BEdFA62987c48');
    await expect(page.locator('//div[@data-cy="address"]//label[@data-cy="input-field-message"]'))
      .toHaveText("Sender's and recipient's addresses are the same. You are about to send ETH to your own account.");
  });

  test('SH Wallet_rst_eth_acc details_testnet', async ({ page }) => {
    await switchToTestnet(page, expect);
    // Add ETH account to be visible
    await addEthereumAccount(page, expect);

    // Check account information screen
    await page.locator('//div[@data-cy="account-name-number"]').last().click();
    // If the loader takes longer then 10 sec to show the no transactions message,
    // check if loader is visible
    if (await page.getByTestId('list').isVisible({ timeout: 10000 }) === true) {
      await expect(page.getByTestId('list')).toContainText('Received');
    } else {
      console.log('Loader is visible!');
    }
    await eyes.check('ETH acc screen', Target.window().matchLevel(MatchLevel.Strict));
    // await expect(page.getByTestId('list')).toContainText('Received', {timeout:15000});

    // Check Assets screen
    await page.locator('//a[@data-cy="account-details-assets"]').click();
    await page.locator('//div[@protocol="ethereum"]').click();
    await expect(page.locator('//div[@class="title"]//span//span')).toContainText('Coin details');
    await eyes.check('ETH coin details', Target.window().matchLevel(MatchLevel.Strict));
    await page.locator('//a[@href="/coins/ethereum/details"]').click();
    await eyes.check('ETH details', Target.region(page.locator('//div[@class="token-details"]/parent::ion-content')).fully());
  });

  /* TODO
  > ERC-20 Token
  > Faucet
*/

  test('SH Wallet_rst_eth_get eth from faucet', async ({ page }) => {
    await switchToTestnet(page, expect);
    // Add ETH account to wallet
    await addEthereumAccount(page, expect);

    // Open Facet URL to claim free ETH
    await page.goto(ethFaucetUrl);
    await page.getByPlaceholder('0x0000000000000000000000000000000000000000').fill(ethAccAddress);
    await page.locator('//button').click();

    if (await page.getByText('Success').isVisible()) {
      console.log('Ethereum Faucet claim was a success!');
    } else {
      console.log('Ethereum Faucet claim failed!');
    }
  });

  test('SH Wallet_rst_eth_more_disabled_options', async ({ page }) => {
    // Check for ETH if some More options are not available
    // Add ETH account to wallet
    await addEthereumAccount(page, expect);
    // Open More
    await page.locator('//a[@data-cy="page-more"]').click();
    await eyes.check('ETH More options', Target.window().fully());
  });

  test('SH Wallet_rst_eth_send_no_balance_for_txn_fee', { tag: ['@functional'] }, async ({ page }) => {
    // Account has less amount then the transaction fee
    await switchToTestnet(page, expect);
    // Create 3 ETH accounts in a loop
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 3; i++) {
      // eslint-disable-next-line no-await-in-loop
      await addEthereumAccount(page, expect);
    }
    // Open send and make transaction
    await page.getByRole('button', { name: 'Send assets to others' }).click();
    await page.locator('//textarea[@data-cy="textarea"]').fill(ethAccAddress);
    await page.locator('//input[@name="amount"]').fill('12');
    // As the mainnet account does not have any coins, the error message will be different
    await expect(page.locator('//div[@data-cy="amount"]//label[@data-cy="input-field-message"]'))
      .toContainText('ETH balance is not enough to pay for transaction fee', { timeout: 8000 });
  });

  test('SH Wallet_rst_eth_share_account_address', async ({ page }) => {
    // Check Share screen
    await switchToTestnet(page, expect);
    // Add ETH account to wallet
    await addEthereumAccount(page, expect);
    // Open Account details screen
    await page.locator('//div[@data-cy="account-name-number"]').last().click();
    await page.locator('//button[@data-cy="share-address"]').click();
    await eyes.check('Share your public address_ETH', Target.window().fully());
    await page.getByTestId('btn-close').nth(1).click();
  });

  test('SH Wallet_rst_eth_walletconnect', async ({ page, context }) => {
    // Open Uniswap for WalletConnect URI
    const page2 = await context.newPage();
    await page2.goto('https://app.uniswap.org/swap?chain=sepolia');
    // Close pop up add
    await page2.locator('//button[@data-testid="navbar-connect-wallet"]').click();
    await page2.locator('//button[@data-testid="wallet-option-walletConnect"]').click();

    // Copy WC URI
    const element = page2.locator('wcm-qrcode');
    const uri = await element.getAttribute('uri');

    // Use the Wallet Connect URI to connect with ETH account
    await switchToTestnet(page, expect);
    // Add ETH account to wallet
    await addEthereumAccount(page, expect);

    //  Open WalletConnect screen
    await page.locator('//button[@data-cy="btn-wallet-connect"]').click();
    await expect(page.locator('//div//h2')).toContainText('Connect to Ethereum dapp');
    await page.waitForTimeout(500);
    await eyes.check('Connect to Ethereum dapp', Target.window().fully());
    await page.getByTestId('scan-button').click();
    await expect(page.locator('//div[@class="title"]')).toContainText('WalletConnect URI');
    await page.getByTestId('btn-close').nth(1).click();
    await page.locator('//textarea[@data-cy="textarea"]').fill(uri as string);
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: 'Connect' }).click();
    await page.waitForTimeout(1500);
    await expect(page.locator('//div[@class="value"]').first()).toContainText('Connected', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await eyes.check('WC connected', Target.window().fully());
    await page.getByRole('button', { name: 'Disconnect' }).click();
  });

  test('SH Wallet_rst_eth_import_key', async ({ page }) => {
    await switchToTestnet(page, expect);
    await page.getByTestId('bullet-switcher-add').click();
    await page.getByTestId('account-card-add').click();
    await page.getByTestId('btn-add-ethereum').click();
    await page.locator('//button[@header="Import with private key"]').click();
    // Account private key helper text
    await page.locator('//div[@data-cy="field-private-key"]//button').click();
    await eyes.check('Prvate Key helper', Target.window().fully());
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByPlaceholder('Enter or paste your private key here').fill('d72b0e021eb1265d2471932286708037ceda28ecc500921735a39a302b866fa7');
    await page.getByTestId('btn-import').click();
    await expect(page.locator('//div[@data-cy="account-name-number"]').last()).toHaveText('PK Ethereum account 1');
    await page.locator('//div[@data-cy="account-name-number"]').last().click();
    await page.locator('//div[@class="horizontal-scroll buttons"]//button[@data-cy="receive"]').click();
    await expect(page.getByRole('heading')).toContainText('Receive Ethereum to public address');
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
