
describe("Test cases AmountSend component", () => {
  beforeEach(() => {
    cy
    .login()
    .openTip()
  })

  it("should calculate currency on enter amount", () => {
    cy
    .enterAmountSend(5)
    .get('[data-cy=amount-currency]')
    .invoke('text')
    .then(text => expect(text).not.to.eq('0.000 USD'))
    .enterAmountSend(0)
    .get('[data-cy=amount-currency]')
    .invoke('text')
    .then(text => expect(text).to.eq('0.000 USD'))
  })


  it("should validate entered amount", () => {
    cy
    .enterAmountSend('asd')
    .inputShouldHaveError('[data-cy=input]')
    .get('[data-cy=amount-currency]')
    .invoke('text')
    .then(text => expect(text).to.eq('0.000 USD'))
    .enterAmountSend(0)
    .get('[data-cy=input]')
    .should('not.have.class','has-error')
  })

  
})