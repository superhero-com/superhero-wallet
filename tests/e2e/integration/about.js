describe('About', () => {
  beforeEach(() => {
    cy.login();
  });

  it('opens page and go back, opens terms, privacy policy ', () => {
    cy.openMenu()
      .get('[data-cy=about]')
      .click()
      .urlEquals('/about')
      .goBack()
      .urlEquals('/account')

      .openMenu()
      .get('[data-cy=about]')
      .click()
      .get('[data-cy=terms]')
      .click()
      .urlEquals('/about/termsOfService')

      .openMenu()
      .get('[data-cy=about]')
      .click()
      .get('[data-cy=privacy]')
      .click()
      .urlEquals('/about/privacyPolicy');
  });
});
