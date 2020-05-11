const publicKey = 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5';

describe('Test cases for Withdraw Page', () => {
  beforeEach(() => {
    cy.login().openWithdraw();
  });

  it('opens Withdraw page; buttons: dropdown, scan - works', () => {
    cy.get('[data-cy=send-container]')
      .should('be.visible')

      .get('[data-cy=toggle-currency-dropdown]')
      .should('be.visible')
      .click()
      .get('[data-cy=currency-dropdown]')
      .should('have.class', 'show')
      .get('[data-cy=toggle-currency-dropdown]')
      .click()
      .get('[data-cy=currency-dropdown]')
      .should('not.have.class', 'show')

      .get('[data-cy=scan-button]')
      .click()
      .get('.primary-title')
      .should('be.visible');
  });

  it('Validate entered amount', () => {
    cy.enterAmountSend('asd')
      .inputShouldHaveError('[data-cy=input-number]')
      .get('[data-cy=amount-currency]')
      .invoke('text')
      .then(text => expect(text.trim()).to.eq('0.00 USD'))
      .enterAmountSend(0)
      .get('[data-cy=input-number]')
      .should('have.class', 'has-error')
      .enterAmountSend(0.1)
      .get('[data-cy=input-number]')
      .should('not.have.class', 'has-error')
      .enterAddress('asd')
      .inputShouldHaveError('[data-cy=address]')
      .enterAddress(0)
      .inputShouldHaveError('[data-cy=address]')
      .enterAddress('ak_wMHNCzQJ4HUL3TZ1fi6nQsHg6TjmHLs1bPXSp8iQ1VmxGNAZ4')
      .get('[data-cy=address]')
      .should('not.have.class', 'has-error')
      .enterAddress('vmangelovv.chain')
      .should('not.have.class', 'has-error');
  });

  it('Continue to step 2(Review) if all inputs are valid, valid AND send', () => {
    cy.get('[data-cy=review-withdraw]')
      .should('have.class', 'disabled')
      .enterAddress('ak_wMHNCzQJ4HUL3TZ1fi6nQsHg6TjmHLs1bPXSp8iQ1VmxGNAZ4')
      .should('not.have.class', 'has-error')
      .enterAmountSend(0.01)
      .should('not.have.class', 'has-error')
      .get('[data-cy=review-withdraw]')
      .should('not.have.class', 'disabled')
      .click()
      .get('div.step2')
      .should('be.visible')

      // check on step2 if everything is OK
      .get('[data-cy=review-sendingAddress]')
      .should('have.text', publicKey)
      .get('[data-cy=review-receivingAddress]')
      .should('have.text', 'ak_wMHNCzQJ4HUL3TZ1fi6nQsHg6TjmHLs1bPXSp8iQ1VmxGNAZ4')
      .get('[data-cy=review-amount]')
      .should('have.text', '0.010 AE')

      // edit sending address to .chain name
      .get('[data-cy=reivew-editTxDetails-button]')
      .click()
      .enterAddress('vmangelovv.chain')
      .get('[data-cy=review-withdraw]')
      .should('not.have.class', 'disabled')
      .click()
      .get('[data-cy=review-receivingAddress]')
      .should('have.text', 'vmangelovv.chain')

      // send
      .get('[data-cy="review-send-button"]')
      .should('be.visible')
      .click()
      .get('[data-cy=pending-txs]')
      .should('be.visible');
  });
});
