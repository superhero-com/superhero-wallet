describe('About', () => {
  beforeEach(() => {
    cy.login();
  });

  it('opens page and go back, opens terms, privacy policy ', () => {
    cy.openPageMore()
      .get('[data-cy=about]')
      .click()
      .urlEquals('/about')
      .goBack()
      .urlEquals('/account')

      .openPageMore()
      .get('[data-cy=about]')
      .click()
      .get('[data-cy=terms]')
      .click()
      .urlEquals('/about/termsOfService')

      .openPageMore()
      .get('[data-cy=about]')
      .click()
      .get('[data-cy=privacy]')
      .click()
      .urlEquals('/about/privacyPolicy');
  });
});
