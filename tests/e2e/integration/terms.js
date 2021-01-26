describe('Test cases for Terms & Conditions page', () => {
  beforeEach(() => {
    cy.openPopup();
  });

  it('Open terms&conditions page, open accordion and return', () => {
    cy.openTerms()
      .get('[data-cy=terms]')
      .should('not.exist')
      .get('[data-cy=accordion-item]')
      .should('be.visible')

      .toggleAccordionItem(2)
      .accordionItemShould(2, 'be.visible')
      .toggleAccordionItem(4)
      .accordionItemShould(4, 'be.visible')
      .toggleAccordionItem(7)
      .accordionItemShould(7, 'be.visible')
      .toggleAccordionItem(7)
      .accordionItemShould(7, 'not.be.visible')

      .goBack()
      .get('[data-cy=accordion-item]')
      .should('not.exist')
      .urlEquals('/about');
  });
});
