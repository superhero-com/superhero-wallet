// @ts-nocheck
import { Page } from '@playwright/test';
import { WalletPassword } from '../test-data/login.data';

export class WelcomePage {
  constructor(private page: Page) {
    this.page = page;
  }

  // Download links
  firefoxExtensionLink = this.page.getByRole('link', { name: 'Firefox' });

  chromeExtensionLink = this.page.getByRole('link', { name: 'Chrome' });

  appStoreLink = this.page.getByRole('link', { name: 'AppS tore' });

  googlePlayLink = this.page.getByRole('link', { name: 'Google Play' });

  // web version terms acceptance
  // acceptanceTerms = this.page.locator('label span');
  acceptanceTerms = this.page.locator('//label[@data-cy="checkbox"]//span');

  enterSeedPhraseBtn = this.page.getByTestId('import-wallet');

  seedPhraseInputField = this.page.getByPlaceholder('Enter or paste your seed phrase here');

  restoreWalletBtn = this.page.getByRole('button', { name: 'Restore wallet' });

  passwordField = this.page.locator('//input[@name="password"]');

  confirmPasswordField = this.page.locator('//input[@name="confirmPassword"]');

  continueToWallet = this.page.getByTestId('btn-set-password');

  skipPasswordBtn = this.page.getByTestId('btn-skip-password');

  async recoveredWalletLogin(seedPhrase: string): Promise<void> {
    await this.acceptanceTerms.first().click();
    await this.enterSeedPhraseBtn.click();
    await this.seedPhraseInputField.fill(seedPhrase);
    await this.restoreWalletBtn.click();
    await this.skipPasswordBtn.click();
  }

  async SetPassword() {
    await this.passwordField.clear;
    await this.passwordField.fill(WalletPassword.walletPassword);
    await this.confirmPasswordField.clear;
    await this.confirmPasswordField.fill(WalletPassword.walletPassword);
    await this.continueToWallet.click();
  }
}
