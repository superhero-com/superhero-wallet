import { test, expect } from '@playwright/test';

test.describe('App Store checks', () => {
  test('SH Wallet app store check', async ({ page }) => {
    await page.goto('https://apps.apple.com/bg/app/superhero-wallet/id1502786641');
    await expect(page.getByRole('heading', { name: 'Superhero Wallet' })).toBeVisible();
  });

  test('SH Wallet Play store check', async ({ page }) => {
    await page.goto('https://play.google.com/store/apps/details?id=com.superhero.cordova&hl=en&gl=US');
    await expect(page.getByText('Superhero Wallet', { exact: true })).toBeVisible();
  });
});
