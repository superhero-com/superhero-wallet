/* eslint-disable no-console */
import { test, expect } from './fixtures';
import {
  switchToTestnet,
  interceptApiRequests,
  recoverWalletExtension,
  addBitcoinAccount,
  addEthereumAccount,
} from './commands';
import { RestoreWalletData } from '../test-data/login.data';
import { WelcomePage } from '../pages/welcome.page';

test.describe('Chromium extension tests', () => {
  const { aeAccAddress, secAeAccAddress } = RestoreWalletData;
  const { ethAccAddress } = RestoreWalletData;

  test.beforeEach(async ({ page, context, extensionId }) => {
    await interceptApiRequests(context);
    await page.goto(`chrome-extension://${extensionId}/index.html`);
  });

  test('SH Wallet_new_wallet and dashboard', { tag: '@extension' }, async ({ page }) => {
    // Create a new Wallet and check initial dashboard screen
    await page.getByTestId('checkbox').click();
    await page.getByRole('button', { name: 'Create new wallet Get started with Superhero Wallet' }).click();
    const welcomePage = new WelcomePage(page);
    await page.getByTestId('btn-add-aeternity').click();
    await welcomePage.SetPassword();
    await expect(page.getByRole('button', { name: 'Receive from existing wallet' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send assets to others' })).toBeVisible();
    await expect(page.getByText('Claim your own .chain name')).toBeVisible();
    await expect(page.getByText('Back up now')).toBeVisible();
    // Check if a second account wasn't created
    await expect(page.locator('//a[@data-cy="account-card-base" and @idx="1"]')).not.toBeVisible();
  });

  test('SH Wallet_rst_receive_screen', async ({ page }) => {
  // Check the AE Receive screen
  // Open Receive screen from Dashboard
    await recoverWalletExtension(page);
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

    // The ae account address from the URL to aescan
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
    await expect(page.locator('//div[@name="amount"]//label[@data-cy="input-field-message"]'))
      .toHaveText('Amount must be more than 0.');
  });

  test('SH Wallet_rst_send_screen', async ({ page }) => {
  // Check the AE Send screen with error input messages
  // Open Send screen from dashboard
    await recoverWalletExtension(page);
    await page.getByRole('button', { name: 'Send assets to others' }).click();
    await page.getByTestId('btn-close').click();
    // Open Send screen from Account details page
    await page.getByTestId('account-card-base').first().click();
    await page.locator('//div[@class="horizontal-scroll buttons"]//button[@data-cy="send"]').click();

    // Check Send main screen
    await expect(page.getByRole('heading', { name: 'Send funds' })).toBeVisible();
    await expect(page.getByText('Transaction fee')).toBeVisible();

    // Open Recipient help pop up, make screen check, close pop up
    await page.getByTestId('address').getByRole('button').first().click();
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

    // Sender and receiver the same address
    await page.locator('//textarea[@data-cy="textarea"]').fill(aeAccAddress);
    await expect(page.locator('//div[@data-cy="address"]//label[@data-cy="input-field-message"]'))
      .toHaveText("Sender's and recipient's addresses are the same. You are about to send AE to your own account.");

    // Open Payload help pop up, make screen check, close pop up
    await page.locator('//div[@class="payload-add-wrapper"]/button[@class="btn-help button-plain btn-help"]').click();
    await page.getByRole('button', { name: 'OK' }).click();

    // Open Payload screen
    await page.getByRole('button', { name: 'Payload' }).click();
    await page.getByLabel('Payload message').fill('Hello. This is a test!');
    // Close Payload pop up
    await page.getByRole('button', { name: 'Done' }).click();
  });

  test('SH Wallet_rst_send_funds_qr_scan', async ({ page }) => {
  // Check the appearance of QR code in send funds modal
    await recoverWalletExtension(page);
    // Open send and make transaction
    await page.getByRole('button', { name: 'Send assets to others' }).click();
    await page.getByTestId('scan-button').click();
    await page.waitForTimeout(600);
    await expect.soft(page.locator('//div[@class="title"]')).toContainText('Scan the recipient’s account address QR code in order to send æternity to them.');
    await page.getByTestId('btn-close').nth(1).click();
  });

  test('SH Wallet_rst_more_network change', async ({ page }) => {
  // Check the Network settings, changing the network and adding custom network
  // Open network menu
    await recoverWalletExtension(page);
    await page.getByRole('button', { name: 'Mainnet' }).click();
    await expect(page.getByRole('paragraph')).toContainText('Connect to network');

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

    // Add custom network screen
    await page.locator('//a[@data-cy="to-add"]').click();
    await page.getByLabel('Network name').fill('Regression test');
    await page.locator('//button[@data-cy="btn-add-network"]').click();

    // Check if new network was added
    await expect(page.locator('#app-wrapper')).toContainText('Regression test');

    // Remove custom network
    await page.locator('span').filter({ hasText: 'Regression test' }).getByRole('button').click();
    await expect(page.locator('#app-wrapper')).toContainText('Are you sure you want to delete this custom network?');
    await page.getByRole('button', { name: 'Confirm' }).click();
    // Removed Test network should not be listed anymore
    await expect(page.locator('//p[@data-cy="network-name" and text()="Regression test"]')).not.toBeVisible();
  });

  test('SH Wallet_rst_ae_airgap_account_import', async ({ page }) => {
  // Check AirGap functionality screens
    await recoverWalletExtension(page);
    await switchToTestnet(page, expect);
    await page.getByTestId('bullet-switcher-add').click();
    await page.getByTestId('account-card-add').click();
    await page.getByTestId('btn-add-aeternity').click();
    await page.locator('//button[@header="Import AirGap accounts"]').click();
    // Check scan functionality availability
    await page.getByTestId('scan-button').click();
    await expect(page.locator('//div[text()="Scan QR code"]')).toBeVisible();
    await page.getByTestId('btn-close').last().click();
    await page.getByTestId('input-wrapper').fill('2LpfcPxwkWDgnKsCXYUkxBtFPjZg8YD5DWqcLx8UjMnFWjpSVMbiVquMkCGQp66Xc7cVi2uV6Vr7hSAiD564Dxgt3tNimE2EyrWyasZQwH7uYprwkEuKhgqFAnLgY4Sg1sadtFskTyyZp4yJFZPqmCmY');
    await page.getByRole('button', { name: 'Import Account' }).last().click();
    await expect(page.locator('//div[@data-cy="account-name-number"]').last())
      .toContainText('AirGap account 1', { timeout: 8000 });
    // Check Send modal for AirGap account
    await page.locator('//button[@data-cy="send"]').click();
    await expect(page.locator('//h2[text()="Send funds from AirGap account"]')).toBeVisible();
    await page.locator('//textarea[@data-cy="textarea"]').fill(aeAccAddress);
    await page.locator('//input[@name="amount"]').fill('1');
    await page.locator('//button[@data-cy="next-step-button"]').click();
    await expect(page.locator('//div[@class="custom-header-title"]'))
      .toContainText('Sign transaction');
    await page.locator('//div[@class="custom-header-title" and contains(text(),"Sign transaction")]//button[@class="btn-help button-plain btn-help"]').click();
    await page.getByRole('button', { name: 'OK' }).click();
    await page.locator('//button[@data-cy="next-step-button"]').click();
    await expect(page.locator('//div[@class="custom-header-title"]').nth(1))
      .toContainText('Broadcast transaction');
  });

  test('SH Wallet_rst_ae_share_account_address', async ({ page }) => {
  // Check Share screen
    await recoverWalletExtension(page);
    await switchToTestnet(page, expect);
    // Open Account details screen
    await page.getByTestId('account-card-base').first().click();
    await page.locator('//button[@data-cy="share-address"]').click();
    await page.getByTestId('btn-close').nth(1).click();
  });

  test('SH Wallet_rst_ae_address_book', async ({ page }) => {
  // Check Address book screens
    await recoverWalletExtension(page);
    await page.locator('//a[@data-cy="page-more"]').click();
    // Open Address book
    await page.locator('a').filter({ hasText: 'Address book' }).click();
    await expect(page.locator('//div[@class="truncate text"]')).toContainText('Address book');
    // Add ae address
    await page.getByTestId('add-address').click();
    await page.locator('//div[@data-cy="name"]//textarea').fill('ae test name');
    await page.locator('//div[@data-cy="address"]//textarea').fill(secAeAccAddress);
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForTimeout(800);
    await expect(page.locator('//a[@data-cy="address-book-item" and @idx="0"]')).toContainText('ae test name');
    // Add BTC address
    await page.getByTestId('add-address').click();
    await page.locator('//div[@data-cy="name"]//textarea').fill('btc test name');
    await page.locator('//div[@data-cy="address"]//textarea').fill('bc1qkwagn38f4zv80wdlhw539vn7geyvsyaj79jejw');
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.locator('//a[@data-cy="address-book-item" and @idx="1"]')).toContainText('btc test name');
    // Add ETH address
    await page.waitForTimeout(800);
    await page.getByTestId('add-address').click();
    await page.locator('//div[@data-cy="name"]//textarea').fill('eth test name');
    await page.locator('//div[@data-cy="address"]//textarea').fill('0x56eFaF7299AA9C7b3F7935f88908596A8b11a016');
    await page.waitForTimeout(800);
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
    await recoverWalletExtension(page);
    await page.locator('//a[@data-cy="page-more"]').click();
    // Open Address book
    await page.locator('a').filter({ hasText: 'Address book' }).click();
    // Add ae address
    await page.getByTestId('add-address').click();
    await page.locator('//div[@data-cy="name"]//textarea').fill('ae test name');
    await page.locator('//div[@data-cy="address"]//textarea').fill(secAeAccAddress);
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.getByTestId('btn-close').click();
    // Open send screen
    await page.getByRole('button', { name: 'Send assets to others' }).click();
    await page.getByTestId('address-book-button').click();
    await page.locator('//button[@data-cy="address-book-item" and @idx="0"]').click();
    await page.waitForTimeout(1500);
    await expect(page.locator('//div[@class="address-truncated"]').last()).toContainText(secAeAccAddress.substring(0, 6));
  });

  /*  Etherium Tests */

  test('SH Wallet_rst_receive eth_mainnet', async ({ page }) => {
  // Add ETH account to be visible
    await recoverWalletExtension(page);
    await addEthereumAccount(page, expect);
    // Open Receive screen from Dashboard
    await page.getByTestId('receive').click();
    await page.getByTestId('btn-close').click();
    // Open Receive screen from Account details page
    await page.waitForTimeout(800);
    await page.locator('//div[@data-cy="account-name-number" and contains(text(),"Ethereum account")]').click();
    await page.locator('//div[@class="horizontal-scroll buttons"]//button[@data-cy="receive"]').click();
    // Check for elements
    await expect(page.getByRole('heading')).toContainText('Receive Ethereum to public address');
    await expect(page.getByText('Request specific amount')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();

    await page.locator('//button[@data-cy="copy"]').click();
    await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();
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
    await recoverWalletExtension(page);
    await addEthereumAccount(page, expect);
    // Open Send screen from dashboard
    await page.getByRole('button', { name: 'Send' }).click();
    await page.getByTestId('btn-close').click();
    // Open Send screen from Account details page
    await page.locator('//div[@data-cy="account-name-number" and contains(text(),"Ethereum account")]').click();
    await page.locator('//div[@class="horizontal-scroll buttons"]/button[@data-cy="send"]').click();

    // Check Send main screen
    await expect(page.getByRole('heading', { name: 'Send Ethereum' })).toBeVisible();
    await page.waitForTimeout(600);
    await expect(page.getByText('Estimated transaction fee ')).toBeVisible();
    await expect(page.getByText('Maximum transaction fee ')).toBeVisible();

    // Open Recipient help pop up, make screen check, close pop up
    await page.getByTestId('address').getByRole('button').first().click();
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

  /*  Bitcoin Tests */

  test('SH Wallet_rst_receive btc_mainnet', async ({ page }) => {
  // Add BTC account to be visible
    await recoverWalletExtension(page);
    await addBitcoinAccount(page, expect);
    // Open Receive screen from Dashboard
    await page.getByTestId('receive').click();
    await page.getByTestId('btn-close').click();
    // Open Receive screen from Account details page
    await page.locator('//a[@data-cy="account-card-base"]//span[text()="BTC"]').click();
    await page.getByTestId('receive').last().click();
    await expect(page.getByRole('heading')).toContainText('Receive Bitcoin to public address');
    await expect(page.getByText('Request specific amount')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();

    await page.locator('//button[@data-cy="copy"]').click();
    await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();

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
  });

  test('SH Wallet_rst_btc_send_screen', async ({ page }) => {
  // Add BTC account to be visible
    await recoverWalletExtension(page);
    await addBitcoinAccount(page, expect);
    // Open Send screen from dashboard
    await page.getByRole('button', { name: 'Send' }).click();
    await page.getByTestId('btn-close').click();
    // Open Send screen from Account details page
    await page.locator('//a[@data-cy="account-card-base"]//span[text()="BTC"]').click();
    await page.locator('//div[@class="horizontal-scroll buttons"]/button[@data-cy="send"]').click();

    // Check Send main screen
    await expect(page.getByRole('heading', { name: 'Send Bitcoin' })).toBeVisible();
    await expect(page.getByText('Transaction fee')).toBeVisible();

    // Open Recipient help pop up, make screen check, close pop up
    await page.locator('//div[@class="transfer-send-recipient"]//button[@class="btn-help button-plain btn-help"]').click();
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
});
