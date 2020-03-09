describe("Test cases for Terms & Conditions page", () => {
  beforeEach(() => {
    cy.openPopup()
  })

  it("should open terms&conditions page", () => {
    cy
    .openTerms()
    .get('[data-cy=terms]')
    .should('not.exist')
    .get('[data-cy=accordion-item]')
    .should('be.visible')
  })

  it("should return to index", () => {
    cy
    .openTerms()
    .get('[data-cy=back-arrow]')
    .click()
    .get('[data-cy=accordion-item]')
    .should('not.be.visible')
    .get('[data-cy=checkbox]')
    .should('be.visible')
  })


  it("should open accordion", () => {
    cy
    .openTerms()
    .toggleAccordionItem(2)
    .accordionItemShould(2,'be.visible')
    .toggleAccordionItem(4)
    .accordionItemShould(4,'be.visible')
    .toggleAccordionItem(7)
    .accordionItemShould(7,'be.visible')
    .toggleAccordionItem(7)
    .accordionItemShould(7,'not.be.visible')
  })

})