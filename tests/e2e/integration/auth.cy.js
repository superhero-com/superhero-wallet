import { AUTHENTICATION_TIMEOUTS } from '@/constants';
import locale from '../../../src/popup/locales/en-US.json';
import { TEST_ACCOUNT } from '../../fixtures/account';

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

    submitPasswordChange('wrong-password', newPassword);
    cy.get('[data-cy=current-password] [data-cy=input-field-message]')
      .should('contain', locale.pages.secureLogin.login.error)
      .get('.info-box')
      .should('not.exist');

    submitPasswordChange(TEST_ACCOUNT.password, newPassword);
    cy.get('.info-box')
      .should('contain', locale.pages.changePassword.success)

      // Pages left behind stay mounted, each with its own header.
      .get('[data-cy=back-arrow]:visible')
      .click()
      .location('pathname')
      .should('eq', '/more/settings')
      .get('[data-cy=back-arrow]:visible')
      .click()
      .get('[data-cy=lock-wallet]')
      .click()
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
});
