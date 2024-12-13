import { Page, BrowserContext, Expect } from '@playwright/test';
import { WalletPassword, RestoreWalletData } from '../test-data/login.data';
import { WelcomePage } from '../pages/welcome.page';

export async function openWalletSettings(page: Page) {
  await page.locator('//a[@data-cy="page-more"]').click();
  await page.locator('//a[@data-cy="settings"]').click();
}

export async function resetWallet(page: Page) {
  await openWalletSettings(page);
  // Open Reset Wallet menu
  await page.locator('a').filter({ hasText: 'Reset wallet' }).click();
  await page.getByRole('button', { name: 'Reset wallet' }).click();
  //  Confirm wallet reset
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
}

export async function switchToTestnet(page: Page, expect: Expect) {
  await expect(page.getByTestId('app-unauthenticated-placeholder').first()).not.toBeVisible();
  await page.getByRole('button', { name: 'Mainnet' }).click();
  await page.getByRole('button', { name: 'Testnet Connect to testnet' }).click();
}

export async function interceptApiRequests(context: BrowserContext) {
  await context.route('https://api.coingecko.com/api/v3/simple/price?*', async (route) => {
    const json = { aeternity: { usd: 0.06096 } };
    await route.fulfill({ json });
  });
  await context.route('https://api.coingecko.com/api/v3/coins/markets?*', async (route) => {
    const json = [{ id: 'aeternity', symbol: 'ae', name: 'Aeternity' }];
    await route.fulfill({ json });
  });
}

export async function revokePendingProposal(page: Page, expect: Expect) {
  if (await page.locator('//div[@data-swiper-slide-index="0"]//div[@class="account-card-consensus"]').isVisible() === true) {
    await page.waitForTimeout(1000);
    // Check if Propose tx buttons are disabled
    await expect(page.locator('//button[@data-cy="send"]').nth(1)).toHaveAttribute('aria-disabled', 'true');
    await page.locator('//div[@class="dashboard-base dashboard-multisig"]//a').first().click();
    // await page.getByTestId('account-card-base').nth(0).click();
    await expect(page.locator('//button[@data-cy="send"]').nth(1)).toHaveAttribute('aria-disabled', 'true');
    await page.getByTestId('btn-close').click();

    await page.locator('//div[@class="dashboard-base-cards"]//div[@class="panel pending-multisig-transaction-card"]//a').click();
    await page.locator('//div[@class="multisig-proposal-details"]//button[text()="Revoke transaction proposal"]').click();

    // Revoke confirmation pop up
    await expect(page.locator('//h2[text()="Revoke transaction proposal"]')).toBeVisible();
    await page.locator('//button[@data-cy="to-confirm"]').click();
    // await page.locator('//button[@data-cy="accept"]').click();
    await expect(page.getByTestId('account-card-base').nth(1)).not.toBeVisible();
    // await page.getByRole('button', { name: 'Show multisig vaults' }).click({ timeout: 15000 });
  }
}

export async function unlockWallet(page: Page) {
  await page.locator('//input[@data-cy="input"]').fill(WalletPassword.walletPassword);
  await page.getByRole('button', { name: 'Unlock' }).click();
}

export async function recoverWalletExtension(page: Page) {
  const welcomePage = new WelcomePage(page);
  await page.getByTestId('checkbox').click();
  await welcomePage.recoveredWalletLogin(RestoreWalletData.testWalletSeed);
  await page.getByRole('button', { name: 'Skip password' });
}

export async function addBitcoinAccount(page: Page, expect: Expect) {
  await page.getByTestId('bullet-switcher-add').click();
  await page.getByTestId('account-card-add').click();
  await page.getByTestId('btn-add-bitcoin').click();
  await page.getByTestId('create-plain-account').last().click();
  await expect(page.getByTestId('account-name-number').last()).toContainText('Bitcoin account');
}

export async function addEthereumAccount(page: Page, expect: Expect) {
  await page.getByTestId('bullet-switcher-add').click();
  await page.getByTestId('account-card-add').click();
  await page.getByTestId('btn-add-ethereum').click();
  await page.getByTestId('create-plain-account').last().click();
  await expect(page.getByTestId('account-name-number').last()).toContainText('Ethereum account');
}

export async function addAeternityAccount(page: Page) {
  await page.getByTestId('bullet-switcher-add').click();
  await page.getByTestId('account-card-add').click();
  await page.getByTestId('btn-add-aeternity').click();
  await page.getByTestId('create-plain-account').last().click();
}
