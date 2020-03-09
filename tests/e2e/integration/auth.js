describe("Test cases for login functionality", () => {

  it("is on account when login", () => {
    cy
    .login()
    .get('[data-cy=balance-info]')
    .should('be.visible')
  })
  
})