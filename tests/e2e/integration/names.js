const name = 'test1.chain';
const resultName = 'test1\u200E.chain';
describe('Test cases for names', () => {
  it('Contains .chain name in sidebar menu and account info', () => {
    cy.login({ name })
      .openMenu()
      .get('[data-cy=chain-name]')
      .truncateStringShouldContain('[data-cy=chain-name] .truncate-mid', resultName)
      .truncateStringShouldContain('[data-cy=account-name] .truncate-mid', resultName);
  });
});
