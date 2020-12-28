describe('Test cases AmountSend component', () => {
  it('Calculates currency on enter amount, validates entered amount, shows correct balance', () => {
    cy.login()
      .openWithdraw()
      .enterAmountSend(5)
      .get('[data-cy=amount-currency]')
      .invoke('text')
      .then((text) => expect(text).not.to.eq('$0.00'))
      .enterAmountSend(0)
      .get('[data-cy=amount-currency]')
      .invoke('text')
      .then((text) => expect(text.trim()).to.eq('$0.00'))

      .enterAmountSend(0)
      .get('[data-cy=input-number]')
      .should('have.class', 'has-error')
      .enterAmountSend(-1)
      .get('[data-cy=input-number]')
      .should('have.class', 'has-error')
      .enterAmountSend(0.2)
      .get('[data-cy=input-number]')
      .should('not.have.class', 'has-error')

      .get('[data-cy=balance]')
      .invoke('text')
      .then((text) => expect(text.trim()).to.match(/\d+\.\d+\s+AE/))
      .get('[data-cy=balance-currency]', { timeout: 8000 })
      .invoke('text')
      .then((text) => expect(text.trim()).not.to.eq('$0.00'));
  });
});
