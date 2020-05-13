describe('Test cases for Top Up Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Go to top-up Page, home button works', () => {
    cy.get('[data-cy=hamburger]')
      .click()
      .menuShould('be.visible')
      .get('[data-cy=receive]')
      .click()
      .get('[data-cy=top-up-container]')
      .should('be.visible')

      .get('[data-cy=home]')
      .click()
      .urlEquals('/account');
  });

  it('Check Claim-Name Button', () => {
    cy.get('[data-cy="account-name"]')
      .should('be.visible')
      .click()
      .get('[data-cy=names-container]')
      .should('be.visible');
  });
});
