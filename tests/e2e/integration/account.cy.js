describe('Test cases for Account Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Checks dissapearing seed phrase backup button, opens/close sidebar, checks account name', () => {
    cy.get('[data-cy=backup-seed-phrase]')
      .should('be.visible')

      .get('[data-cy=account-name-number')
      .should('be.visible');
  });
});
