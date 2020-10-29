const name = 'test.chain';
describe('Test cases for names', () => {
  it('Contains .chain name in sidebar menu and account info', () => {
    cy.login({ name })
      .openMenu()
      .get('[data-cy=chain-name]')
      .should('be.visible')
      .contains(name)

      .get('[data-cy=account-name]')
      .should('be.visible')
      .contains(name);
  });
});
