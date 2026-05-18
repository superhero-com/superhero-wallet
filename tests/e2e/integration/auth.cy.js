import { TEST_ACCOUNT } from '../../fixtures/account';

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
});
