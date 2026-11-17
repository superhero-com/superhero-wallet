import locale from '../../../src/popup/locales/en-US.json';
import { TEST_ACCOUNT } from '../../fixtures/account';

describe('Test cases for Account Page', () => {
  it('shows the account name and the backup card until the seed phrase is backed up', () => {
    cy.login()
      .get('[data-cy=account-name-number]')
      .should('have.text', `æternity ${locale.pages.account.heading} 1`)
      .get('[data-cy=backup-seed-phrase] .card-button')
      .click()
      .get('[data-cy=reveal-seed-phrase]')
      .click()
      .loginUsingPassword();
    cy.contains('.btn-base', locale.pages.seedPhrase.verifySeed)
      .click()
      .loginUsingPassword();
    TEST_ACCOUNT.mnemonic.split(' ').forEach((word) => {
      cy.contains('.source-phrases .seed-phrase-badge', new RegExp(`^${word}$`)).click();
    });
    cy.get('.verify-button')
      .click();
    cy.contains('.btn-base', locale.common.backToHome)
      .click()
      .location('pathname')
      .should('eq', '/account')
      .get('[data-cy=backup-seed-phrase]')
      .should('not.exist');
  });
});
