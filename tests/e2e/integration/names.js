const name = "test.chain"
describe("Test cases for menu sidebar component", () => {
  beforeEach(() => {
    cy.login(name)
  })


  it("sidebar menu should show .chain name", () => {
    cy
    .openMenu()
    .get('[data-cy=chain-name]')
    .should('be.visible')
    .contains(name)
  })

  it("account infor should containr .chain name", () => {
    cy
    .get('[data-cy=account-name]')
    .should('be.visible')
    .contains(name)
  })
})