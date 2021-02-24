describe('Test cases for Top Up Page', () => {
  it('Go to top-up Page, home button works', () => {
    cy.login()
      // TODO: update once Payments page is implemented
      // and button to Receive page is available
      .visit('chrome/popup/popup#/receive')
      .get('[data-cy=top-up-container]')
      .should('be.visible')

      .get('[data-cy=home]')
      .click()
      .urlEquals('/account');
  });
});
