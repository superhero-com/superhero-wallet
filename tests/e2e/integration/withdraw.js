const address = 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5';

describe('Test cases for Withdraw Page', () => {
  it('Opens Withdraw page, uses scan button, validates entered amount, reviews and sends ', () => {
    cy.login()
      .openWithdraw()
      .get('[data-cy=send-container]')
      .should('be.visible')

      .get('[data-cy=scan-button]')
      .click()
      .get('.title')
      .should('be.visible')
      .get('.qr-code-reader video')
      .should('be.visible')
      .get('.modal .button-plain.close')
      .click()

      .enterInputAmount('asd')
      .get('[data-cy=amount-currency]')
      .invoke('text')
      .should((text) => expect(text.trim()).to.eq('($0.00)'))
      .enterInputAmount(0)
      .inputShouldHaveError('[data-cy=input-wrapper]')
      .enterInputAmount(0.2)
      .get('[data-cy=input-wrapper]')
      .should('not.have.class', 'error')
      .enterAddress('asd')
      .inputShouldHaveError('[data-cy=address] [data-cy=input-wrapper]')
      .enterAddress(0)
      .inputShouldHaveError('[data-cy=address] [data-cy=input-wrapper]')
      .enterAddress('vmangelovv.chain')
      .should('not.have.class', 'error')
      .enterAddress('ak_wMHNCzQJ4HUL3TZ1fi6nQsHg6TjmHLs1bPXSp8iQ1VmxGNAZ4')
      .get('[data-cy=address] [data-cy=input-wrapper]')
      .should('not.have.class', 'error')

      .get('[data-cy=review-withdraw]')
      .should('not.have.class', 'disabled')
      .click()
      .get('div.step2')
      .should('be.visible')

      // check on step2 if everything is OK
      .get('[data-cy=review-sender] > a')
      .should('contain', address)
      .get('[data-cy=review-recipient] > a')
      .should('contain', 'ak_wMHNCzQJ4HUL3TZ1fi6nQsHg6TjmHLs1bPXSp8iQ1VmxGNAZ4')
      .get('[data-cy=review-amount]')
      .contains('0.2 AE')

      // edit sending address to .chain name
      .get('[data-cy=reivew-editTxDetails-button]')
      .click()
      .enterAddress('test.chain')
      .get('[data-cy=review-withdraw]')
      .click()
      .get('[data-cy=review-recipient] > a')
      .should('contain', 'test.chain')

      // send
      .get('[data-cy="review-send-button"]')
      .should('be.visible')
      .click()
      .get('[data-cy=pending-txs]')
      .should('be.visible');
  });
});
