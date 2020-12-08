describe('Test cases for login functionality', () => {
  it('Is on account page when login, no access to routes when auth/not auth', () => {
    cy.login()
      .get('[data-cy=balance-info]')
      .should('be.visible')

      .shouldRedirect('/intro', '/account')
      .shouldRedirect('/', '/account')
      .shouldRedirect('/importAccount', '/account')
      .shouldRedirect('/about/termsOfService', '/about/termsOfService')

      .logout()
      .shouldRedirect('/account', '/')
      .shouldRedirect('/intro', '/intro')
      .shouldRedirect('/tip', '/')
      .shouldRedirect('/settings', '/')
      .shouldRedirect('/send', '/')
      .shouldRedirect('/receive', '/')
      .shouldRedirect('/importAccount', '/importAccount')
      .shouldRedirect('/about/termsOfService', '/about/termsOfService');
  });
});
