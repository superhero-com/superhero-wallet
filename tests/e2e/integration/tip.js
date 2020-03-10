
describe("Test cases for tip page", () => {
  beforeEach(() => {
    cy.login()
  })

  // it("should open tip page", () => {
  //   cy
  //   .openTip()
  // })

  // it("should return to account", () => {
  //   cy
  //   .openTip()
  //   .get('[data-cy=back-arrow]')
  //   .click()
  //   .get('[data-cy=tip-container]')
  //   .should('not.be.visible')
  // })

  // it("tip page components are present", () => {
  //   cy
  //   .openTip()
  //   .get('[data-cy=send-tip]')
  //   .should('be.visible')
  //   .get('[data-cy=tip-url]')
  //   .should('exist')
  //   .get('[data-cy=tip-note]')
  //   .should('be.visible')
  //   .get('[data-cy=amount]')
  //   .should('be.visible')
  //   .get('[data-cy=amount-currency]')
  //   .should('be.visible')
  //   .buttonShouldBeDisabled('[data-cy=send-tip]')
  // })

  
  it("should validate tip details", () => {
    cy
    .enterTipDetails()
  })
})