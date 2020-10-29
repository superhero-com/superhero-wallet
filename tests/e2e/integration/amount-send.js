const balance = 10;
describe('Test cases AmountSend component', () => {
  beforeEach(() => {
    cy.login({ balance }).openTip();
  });

  it('Calculate currency on enter amount', () => {
    cy.enterAmountSend(5)
      .get('[data-cy=amount-currency]')
      .invoke('text')
      .then(text => expect(text).not.to.eq('$0.00'))
      .enterAmountSend(0)
      .get('[data-cy=amount-currency]')
      .invoke('text')
      .then(text => expect(text.trim()).to.eq('$0.00'));
  });

  it('Validate entered amount', () => {
    cy.enterAmountSend(0)
      .get('[data-cy=input-number]')
      .should('have.class', 'has-error')
      .enterAmountSend(-1)
      .get('[data-cy=input-number]')
      .should('have.class', 'has-error')
      .enterAmountSend(0.2)
      .get('[data-cy=input-number]')
      .should('not.have.class', 'has-error');
  });

  it('Show correct balance', () => {
    cy.get('[data-cy=balance]')
      .invoke('text')
      .then(text => expect(text.trim()).to.eq(`${balance.toFixed(2)} AE`))
      .get('[data-cy=balance-currency]', { timeout: 8000 })
      .invoke('text')
      .then(text => expect(text.trim()).not.to.eq('$0.00'));
  });
});
