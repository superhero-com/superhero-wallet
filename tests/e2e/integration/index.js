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
    .buttonShouldBeDisabled('[data-cy=generate-wallet]')
    .buttonShouldBeDisabled('[data-cy=import-wallet]')
  })

  it("have create/import wallet buttons", () => {
    cy.get('[data-cy=generate-wallet]').should('be.visible')
    cy.get('[data-cy=import-wallet]').should('be.visible')
  })

  it("terms agree activate buttons", () => {
    cy
    .termsAgree()
    .buttonShouldNotBeDisabled('[data-cy=generate-wallet]')
    .buttonShouldNotBeDisabled('[data-cy=import-wallet]')
  })

  it("terms uncheck disable buttons", () => {
    cy
    .termsAgree()
    .termsAgree()
    .buttonShouldBeDisabled('[data-cy=generate-wallet]')
    .buttonShouldBeDisabled('[data-cy=import-wallet]')
  })

  it("should open terms and conditions", () => {
    cy
    .openTerms()
    .get('[data-cy=terms]')
    .should('not.exist')
  })

  it("should open generate wallet page", () => {
    cy
    .openGenerateWallet()
    .get('[data-cy=generate-wallet]')
    .should('not.exist')
  })

  it("should open import wallet page", () => {
    cy
    .openImportWallet()
    .get('[data-cy=import-wallet]')
    .should('not.exist')
  })
})