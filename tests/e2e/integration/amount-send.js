const balance = 10;
describe('Test cases AmountSend component', () => {
  beforeEach(() => {
    cy.login({ balance }).openTip();
  });

  it('Calculate currency on enter amount', () => {
    cy.enterAmountSend(5)
      .get('[data-cy=amount-currency]')
      .invoke('text')
      .then(text => expect(text).not.to.eq('0.000 USD'))
      .enterAmountSend(0)
      .get('[data-cy=amount-currency]')
      .invoke('text')
      .then(text => expect(text).to.eq('0.000 USD'));
  });

  it('Validate entered amount', () => {
    cy.enterAmountSend('asd')
      .inputShouldHaveError('[data-cy=input-number]')
      .get('[data-cy=amount-currency]')
      .invoke('text')
      .then(text => expect(text).to.eq('0.000 USD'))
      .enterAmountSend(0)
      .get('[data-cy=input-number]')
      .should('have.class', 'has-error')
      .enterAmountSend(0.1)
      .get('[data-cy=input-number]')
      .should('not.have.class', 'has-error');
  });

  it('Show correct balance', () => {
    cy.get('[data-cy=balance]')
      .invoke('text')
      .then(text => expect(text).to.eq(`${balance.toFixed(3)} AE`))
      .wait(2000)
      .get('[data-cy=balance-currency]')
      .invoke('text')
      .then(text => expect(text).not.to.eq('0.000 USD'));
  });
});
