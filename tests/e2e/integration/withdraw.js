import BigNumber from 'bignumber.js';

const ownAddress = 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5';
const recipientAddress = 'ak_wMHNCzQJ4HUL3TZ1fi6nQsHg6TjmHLs1bPXSp8iQ1VmxGNAZ4';
const amount = 0.1;

describe('Test cases for Withdraw Page', () => {
  it('Opens Withdraw page, uses scan button, validates entered amount, reviews and sends ', () => {
    cy.login()
      .openWithdraw()

      .get('[data-cy=scan-button]')
      .click()
      .get('.qr-code-reader video')
      .should('be.visible')
      .get('.modal.qr-code-reader [data-cy=btn-close]')
      .click()

      .enterInputAmount(amount)
      .get('[data-cy=amount]')
      .should('not.have.class', 'error')
      .enterAddress('asd')
      .inputShouldHaveError('[data-cy=address]')
      .enterAddress(0)
      .inputShouldHaveError('[data-cy=address]')
      .enterAddress('test.chain')
      .should('not.have.class', 'error')
      .enterAddress(recipientAddress)
      .get('[data-cy=address]')
      .should('not.have.class', 'error')

      .get('[data-cy=next-step-button]')
      .should('not.have.class', 'disabled')
      .click()
      .get('[data-cy=next-step-button]')
      .should('be.visible')

      // check on step2 if everything is OK
      .get('[data-cy=review-sender] > .value')
      .should('contain', ownAddress)
      .get('[data-cy=review-recipient] > .value')
      .should('contain', recipientAddress)
      .get('[data-cy=review-total]')
      .invoke('text')
      .then((total) => {
        const getNum = (s) => +/[+-]?([0-9]*[.])?[0-9]+/.exec(s)[0];
        const n1 = getNum(total);
        cy.get('[data-cy=review-fee]').invoke('text').then((fee) => {
          const n2 = getNum(fee);
          cy.expect(BigNumber(n1).minus(n2).toNumber()).to.eq(amount);
        });
      })

      // edit, sending to your own account
      .get('[data-cy=edit]')
      .click()
      .enterAddress(ownAddress)
      .get('[data-cy=address]')
      .should('have.class', 'error')
      .get('[data-cy=next-step-button]')
      .should('have.class', 'disabled')

      // send to another account
      .get('[data-cy=amount]')
      .enterAddress(recipientAddress)
      .should('not.have.class', 'error')
      .get('[data-cy=next-step-button]')
      .should('not.have.class', 'disabled')
      .click()
      .get('[data-cy=review-recipient] > .value')
      .should('contain', recipientAddress)
      .get('[data-cy=next-step-button]')
      .click()
      .get('[data-cy=pending-txs]')
      .should('be.visible');
  });
});
