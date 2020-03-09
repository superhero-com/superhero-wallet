

describe("Test cases for Front Page", () => {
  beforeEach(() => {
    cy.openPopup()
  })

  it("should have terms checkbox",() =>{
    cy
    .get('[data-cy=checkbox]')
    .should('be.visible')
  })

  it("buttons should be disabled", () => {
    cy
    .get('[data-cy=generate-wallet]')
    .should('have.class','disabled')
    .get('[data-cy=import-wallet]')
    .should('have.class','disabled')
  })

  it("have create/import wallet buttons", () => {
    cy.get('[data-cy=generate-wallet]').should('be.visible')
    cy.get('[data-cy=import-wallet]').should('be.visible')
  })

  it("terms agree activate buttons", () => {
    cy
    .get('[data-cy=checkbox]')
    .click()
    .get('[data-cy=generate-wallet]')
    .should('not.have.class','disabled')
    .get('[data-cy=import-wallet]')
    .should('not.have.class','disabled')
  })

  it("terms uncheck disable buttons", () => {
    cy
    .get('[data-cy=checkbox]')
    .click()
    .click()
    .get('[data-cy=generate-wallet]')
    .should('have.class','disabled')
    .get('[data-cy=import-wallet]')
    .should('have.class','disabled')
  })

  it("should open terms and conditions", () => {
    cy
    .get('[data-cy=terms]')
    .should('be.visible')
    .click()
    .get('[data-cy=terms]')
    .should('not.exist')
    .get('.title')
    .should('be.visible')
  })
})