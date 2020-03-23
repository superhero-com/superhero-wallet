const name = 'test.chain';
describe('Test cases for names', () => {
  beforeEach(() => {
    cy.login({ name });
  });

  it('Sidebar menu show .chain name', () => {
    cy.openMenu()
      .get('[data-cy=chain-name]')
      .should('be.visible')
      .contains(name);
  });

  it('Account info contain .chain name', () => {
    cy.get('[data-cy=account-name]')
      .should('be.visible')
      .contains(name);
  });
});
