describe('Test cases Amount component', () => {
  it('Calculates currency on enter amount, validates entered amount, shows correct balance', () => {
    cy.login()
      .openWithdraw()
      .enterInputAmount(5)
      .get('[data-cy=amount-currency]')
      .invoke('text')
      .should((text) => expect(text.trim()).not.to.eq('($0.00)'))
      .enterInputAmount(0)
      .get('[data-cy=amount-currency]')
      .invoke('text')
      .should((text) => expect(text.trim()).to.eq('($0.00)'))

      .enterInputAmount(0)
      .get('[data-cy=input-wrapper]')
      .should('have.class', 'error')
      .enterInputAmount(-1)
      .get('[data-cy=input-wrapper]')
      .should('have.class', 'error')
      .enterInputAmount(0.2)
      .get('[data-cy=input-wrapper]')
      .should('not.have.class', 'error');
  });
});
