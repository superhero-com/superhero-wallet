describe('AboutSettings', () => {
  beforeEach(() => {
    cy.login();
  });

  it('opens page and go back, opens terms, privacy policy ', () => {
    cy.openMenu()
      .get('[data-cy=aboutSettings]')
      .click()
      .urlEquals('/aboutSettings')
      .goBack()
      .urlEquals('/account')

      .openMenu()
      .get('[data-cy=aboutSettings]')
      .click()
      .get('[data-cy=terms]')
      .click()
      .urlEquals('/termsOfService')

      .openMenu()
      .get('[data-cy=aboutSettings]')
      .click()
      .get('[data-cy=privacy]')
      .click()
      .urlEquals('/privacyPolicy');
  });
});
