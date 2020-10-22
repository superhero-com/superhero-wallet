describe('Test cases for Top Up Page', () => {
  it('Go to top-up Page, home button works', () => {
    cy.login()
      .get('[data-cy=hamburger]')
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
});
