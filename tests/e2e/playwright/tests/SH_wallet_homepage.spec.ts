import { test } from '@playwright/test';

test('SH Wallet production web platforms check', async ({ context, page }) => {
  await page.goto('https://wallet.superhero.com/');

  await page.getByRole('link', { name: 'Firefox' }).click();
  await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('heading', { name: 'Superhero by Superhero Wallet' }).isVisible()]);

  await page.getByRole('link', { name: 'Chrome' }).click();
  await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('heading', { name: 'Superhero' }).isVisible()]);

  await page.getByRole('link', { name: 'App Store' }).click();
  await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('heading', { name: 'Superhero Wallet 4+' }).isVisible()]);

  await page.getByRole('link', { name: 'Google Play' }).click();
  await Promise.all([
    context.waitForEvent('page'),
    page.getByText('Superhero Wallet').isVisible()]);
});
