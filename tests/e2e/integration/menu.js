describe("Test cases for menu sidebar component", () => {
  beforeEach(() => {
    cy.login()
  })

  it("menu open button should be visible when authenticated", () => {
    cy
    .get('[data-cy=hamburger]')
    .should('be.visible')
  })

  it("should open menu when click hamburger", () => {
    cy
    .get('[data-cy=hamburger]')
    .click()
    .get('[data-cy=sidebar-menu]')
    .should('be.visible')
  })

  
})