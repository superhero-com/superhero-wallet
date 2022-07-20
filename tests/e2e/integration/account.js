describe('Test cases for Account Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Checks dissapearing seed phrase backup button, opens/close sidebar, checks copy button, contains a claim name message', () => {
    cy.get('.seed-backup-notification')
      .should('be.visible')

      .get('[data-cy=copy]')
      .click()
      .get('.copied > .text')
      .should('contain', 'Copied')

      .get('[data-cy=account-name')
      .should('be.visible')
      .contains('Account 1');
  });

  it('Tip, View-All-Transactions, Back to Account', () => {
    cy.get('[data-cy=tip-button]')
      .should('be.visible')
      .click()
      .get('[data-cy=tip-container]')
      .should('be.visible')
      .get('[data-cy=home]')
      .click()

      .get('[data-cy=view-all-transactions]')
      .should('be.visible')
      .click()
      .get('[data-cy=list]')
      .should('exist')
      .get('[data-cy=home]')
      .click()
      .urlEquals('/account');
  });
});
