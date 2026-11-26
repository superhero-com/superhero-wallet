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

  it('imports an æternity private key as sk_ and shows it in hex and as sk_', () => {
    const seedHex = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60';
    const secretKey = 'sk_2CK6vgUFHBTWVA9bMakzaB94Fhjuhwi4K6zQWU7tU8nKQ14rhM';

    cy.login()
      .get('[data-cy=bullet-switcher-add]')
      .click()
      .get('[data-cy=account-card-add]')
      .click()
      .get('[data-cy=btn-add-aeternity]')
      .click()
      .get('[data-cy=import-private-key]')
      .click()
      .get('[data-cy=field-private-key] textarea')
      .type(secretKey)
      .get('[data-cy=btn-import]')
      .click();
    cy.get('[data-cy=btn-import]')
      .should('not.exist');

    // Read back from the storage
    cy.visit('/account-details')
      .loginUsingPassword();
    cy.contains(
      '[data-cy=account-name-number]',
      locale.pages.account.privateKey.replace('{protocol}', 'æternity'),
    )
      .should('exist');
    cy.get('[data-cy=export-private-key]:visible')
      .click()
      .get('.modal [data-cy=password] input')
      .type(TEST_ACCOUNT.password);
    cy.contains('.modal .btn-main', locale.modals.privateKeyExport.mainBtnText)
      .click();
    cy.get('.modal [data-cy=copy]')
      .should('have.text', seedHex)
      .get('.modal [data-cy=format-sk]')
      .click()
      .get('.modal [data-cy=copy]')
      .should('have.text', secretKey);
  });
});
