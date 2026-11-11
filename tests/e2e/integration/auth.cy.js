import { AUTHENTICATION_TIMEOUTS, NETWORK_NAME_TESTNET, STORAGE_KEYS } from '@/constants';
import {
  encrypt,
  generateEncryptionKey,
  generateSalt,
  prepareStorageKey,
} from '@/utils';
import locale from '../../../src/popup/locales/en-US.json';
import { TEST_ACCOUNT } from '../../fixtures/account';

function setPassword(password) {
  cy.get('[data-cy=password] input')
    .type(password)
    .get('[data-cy=confirm-password] input')
    .type(password)
    .get('[data-cy=btn-set-password]')
    .click();
}

function unlock(password) {
  cy.get('[data-cy=password] input')
    .type(password)
    .get('[data-cy=login-btn]')
    .click();
}

function submitPasswordChange(currentPassword, newPassword) {
  cy.get('[data-cy=current-password] input')
    .type(currentPassword)
    .get('[data-cy=new-password] input')
    .type(newPassword)
    .get('[data-cy=confirm-new-password] input')
    .type(newPassword)
    .get('.btn-reset-password')
    .should('not.have.class', 'disabled')
    .click();
}

describe('Test cases for login functionality', () => {
  it('Is on account page when login, no access to routes when auth/not auth', () => {
    cy.login()
      .get('[data-cy=balance-info]')
      .should('be.visible')

      .shouldRedirect('/', '/account', true)
      .shouldRedirect('/more/about/terms', '/more/about/terms', true)

      .logout()
      .shouldRedirect('/account', '/')
      .shouldRedirect('/tips', '/')
      .shouldRedirect('/settings', '/')
      .shouldRedirect('/transfer', '/')
      .shouldRedirect('/more/about/terms', '/more/about/terms');
  });

  // E.g. the app closed while a password change re-encrypted them.
  it('opens the wallet when the imported accounts cannot be decrypted', () => {
    cy.then(async () => {
      const lostKey = await generateEncryptionKey('lost-password', generateSalt());
      return encrypt(lostKey, '[]');
    }).then((privateKeyAccountsRaw) => {
      // One of them was the active account.
      cy.login({ privateKeyAccountsRaw, activeAccountGlobalIdx: 1 });
    });

    cy.get('[data-cy=balance-info]')
      .should('be.visible')
      .urlEquals('/account');
    cy.contains(locale.modals.unreadablePrivateKeyAccounts.title)
      .should('not.exist');
    cy.window()
      .its('localStorage')
      .invoke('getItem', prepareStorageKey([STORAGE_KEYS.activeAccountGlobalIdx]))
      .should('eq', '0');

    // Importing a key offers to remove them first.
    cy.get('[data-cy=bullet-switcher-add]')
      .click()
      .get('[data-cy=account-card-add]')
      .click()
      .get('[data-cy=btn-add-ethereum]')
      .click()
      .get('[data-cy=import-private-key]')
      .click()
      .get('[data-cy=field-private-key] textarea')
      .type('aa'.repeat(32))
      .get('[data-cy=btn-import]')
      .click();
    cy.contains('.modal', locale.modals.unreadablePrivateKeyAccounts.title)
      .find('[data-cy=to-confirm]')
      .click();
    cy.waitForStoredVault((vault) => vault?.values[STORAGE_KEYS.privateKeyAccountsRaw] === null);

    cy.get('[data-cy=btn-import]')
      .click();
    cy.get('[data-cy=btn-import]')
      .should('not.exist');
    cy.contains(
      '[data-cy=account-name-number]',
      locale.pages.account.privateKey.replace('{protocol}', 'Ethereum'),
    )
      .should('exist');
  });

  it('requires password re-authentication before revealing seed phrase', () => {
    cy.login({ isSeedBackedUp: true })
      .get('[data-cy=seed-phrase-mnemonic]')
      .should('not.exist')
      .openPageMore()
      .get('[data-cy=settings]')
      .click()
      .get('[data-cy=seed-phrase-settings]')
      .click()
      .get('[data-cy=reveal-seed-phrase]')
      .click()
      .get('[data-cy=password] input')
      .should('be.visible')
      .get('[data-cy=seed-phrase-mnemonic]')
      .should('not.exist')
      .get('[data-cy=password] input')
      .type(TEST_ACCOUNT.password)
      .get('[data-cy=login-btn]')
      .click()
      .get('[data-cy=seed-phrase-mnemonic]')
      .should('be.visible')
      .should('contain', TEST_ACCOUNT.mnemonic);
  });

  it('changes the password and keeps the data encrypted with it', () => {
    const newPassword = 'newPassword123';
    // Not the default, and encrypted with the password key like the imported accounts.
    const timeoutIdx = AUTHENTICATION_TIMEOUTS.indexOf(60000);

    cy.login()
      .openSecureLoginSettings()
      .get('.timeout')
      .eq(timeoutIdx)
      .click()
      .should('have.class', 'active');
    // The copy the older version stored goes once the first commit is on the disk.
    cy.window()
      .its('localStorage')
      .invoke('getItem', prepareStorageKey([STORAGE_KEYS.mnemonic]))
      .should('be.null');

    submitPasswordChange('wrong-password', newPassword);
    cy.get('[data-cy=current-password] [data-cy=input-field-message]')
      .should('contain', locale.pages.secureLogin.login.error)
      .get('.info-box')
      .should('not.exist');

    submitPasswordChange(TEST_ACCOUNT.password, newPassword);
    cy.get('.info-box')
      .should('contain', locale.pages.changePassword.success);

    // Pages left behind stay mounted, each with its own header.
    cy.get('[data-cy=back-arrow]:visible')
      .click()
      .location('pathname')
      .should('eq', '/more/settings')
      .get('[data-cy=back-arrow]:visible')
      .click()
      .get('[data-cy=lock-wallet]')
      .should('be.visible');
    // A restart reads the new password's data back from the storage.
    cy.reload()
      .get('[data-cy=password] input')
      .type(TEST_ACCOUNT.password)
      .get('[data-cy=login-btn]')
      .click()
      .get('[data-cy=password] [data-cy=input-field-message]')
      .should('contain', locale.pages.secureLogin.login.error)
      .get('[data-cy=password] input')
      .clear()
      .type(newPassword)
      .get('[data-cy=login-btn]')
      .should('not.have.class', 'disabled')
      .click()
      .get('[data-cy=password]')
      .should('not.exist')

      .get('[data-cy=settings]')
      .click()
      .get('[data-cy=secure-login-settings]')
      .click()
      .get('.timeout')
      .eq(timeoutIdx)
      .should('have.class', 'active');
  });

  it('turns the password protection off and on again, then opens only with the new password', () => {
    const newPassword = 'newPassword123';
    const secretKey = STORAGE_KEYS.defaultPasswordSecret;

    cy.login()
      .openSecureLoginSettings()
      .get('[data-cy=password-protection] input')
      .should('be.checked')
      .get('[data-cy=password-protection] .switch')
      .click();
    // Tests ask for the password even without protection, so the vault shows it is off.
    cy.waitForStoredVault((vault) => !!vault?.values[secretKey])
      .get('[data-cy=password-protection] input')
      .should('not.be.checked')
      .get('[data-cy=password-protection] .switch')
      .click();
    setPassword(newPassword);
    cy.waitForStoredVault((vault) => vault?.values[secretKey] === null)
      .get('[data-cy=password-protection] input')
      .should('be.checked');

    cy.reload();
    unlock(TEST_ACCOUNT.password);
    cy.get('[data-cy=password] [data-cy=input-field-message]')
      .should('contain', locale.pages.secureLogin.login.error)
      .get('[data-cy=password] input')
      .clear();
    unlock(newPassword);
    cy.get('[data-cy=password]')
      .should('not.exist');
  });

  it('creates a wallet after a reset, which opens with its password after a restart', () => {
    const newPassword = 'newPassword123';

    cy.login()
      .openPageMore()
      .get('[data-cy=settings]')
      .click()
      .get('[data-cy=reset-wallet-settings]')
      .click()
      .get('.reset-wallet-button')
      .click()
      .get('[data-cy=btn-reset-wallet]')
      .click();
    cy.waitForStoredVault((vault) => vault?.reset === true)
      .get('[data-cy=checkbox]')
      .should('be.visible');
    // The reset removed the network too.
    cy.window().then((win) => {
      // eslint-disable-next-line no-param-reassign
      win.localStorage[prepareStorageKey([STORAGE_KEYS.activeNetworkName])] = (
        JSON.stringify(NETWORK_NAME_TESTNET)
      );
    });
    cy.reload()
      .get('[data-cy=checkbox]')
      .click()
      .get('[data-cy=generate-wallet]')
      .click()
      .get('[data-cy=btn-add-aeternity]')
      .click();
    setPassword(newPassword);
    cy.get('[data-cy=balance-info]')
      .should('be.visible');
    cy.waitForStoredVault((vault) => !!vault?.values[STORAGE_KEYS.mnemonic] && !vault.reset);

    cy.reload();
    unlock(newPassword);
    cy.get('[data-cy=balance-info]')
      .should('be.visible');
  });
});
