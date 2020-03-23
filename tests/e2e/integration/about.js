describe('Tests cases for about page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Open about page ', () => {
    cy.openMenu()
      .get('[data-cy=aboutSettings]')
      .click()
      .urlEquals('/aboutSettings');
  });

  it('Return to account page ', () => {
    cy.openMenu()
      .get('[data-cy=aboutSettings]')
      .click()
      .urlEquals('/aboutSettings')
      .goBack()
      .urlEquals('/account');
  });

  it('Open terms of service', () => {
    cy.openMenu()
      .get('[data-cy=aboutSettings]')
      .click()
      .get('[data-cy=terms]')
      .click()
      .urlEquals('/termsOfService');
  });

  it('Open privacy policy', () => {
    cy.openMenu()
      .get('[data-cy=aboutSettings]')
      .click()
      .get('[data-cy=privacy]')
      .click()
      .urlEquals('/privacyPolicy');
  });
});
