describe('Test cases for login functionality', () => {
  it('Is on account page when login, no access to routes when auth/not auth', () => {
    cy.login()
      .get('[data-cy=balance-info]')
      .should('be.visible')

      .shouldRedirect('/', '/account')
      .shouldRedirect('/import-account', '/account')
      .shouldRedirect('/about/termsOfService', '/about/termsOfService')

      .logout()
      .shouldRedirect('/account', '/')
      .shouldRedirect('/tips', '/')
      .shouldRedirect('/settings', '/')
      .shouldRedirect('/transfer', '/')
      .shouldRedirect('/import-account', '/import-account')
      .shouldRedirect('/about/termsOfService', '/about/termsOfService');
  });
});
