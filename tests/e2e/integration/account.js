describe('Test cases for Account Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Checks dissapearing seed phrase backup button, opens/close sidebar, checks account name', () => {
    cy.get('.seed-backup-notification')
      .should('be.visible')

      .get('[data-cy=account-name')
      .should('be.visible');
  });

  it('View-All-Transactions, Back to Account', () => {
    cy.get('[data-cy=home]')
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
