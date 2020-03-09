describe("Test cases for login functionality", () => {

  it("is on account when login", () => {
    cy
    .login()
    .get('[data-cy=balance-info]')
    .should('be.visible')
  })

  it("should not have access to routes which requires auth", () => {
    cy
    .shouldRedirect('/account','/')
    .shouldRedirect('/intro','/intro')
    .shouldRedirect('/tip','/')
    .shouldRedirect('/settings','/')
    .shouldRedirect('/send','/')
    .shouldRedirect('/receive','/')
    .shouldRedirect('/importAccount','/importAccount')
    .shouldRedirect('/termsOfService','/termsOfService')
  })

  it("should not have access to no auth routes when auth", () => {
    cy
    .login()
    .shouldRedirect('/intro','/account')
    .shouldRedirect('/','/account')
    .shouldRedirect('/importAccount','/account')
    .shouldRedirect('/termsOfService','/termsOfService')
  })
  
})