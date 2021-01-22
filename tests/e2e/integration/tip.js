const tip = { amount: 0.2, note: '#test', url: 'example.com' };
const tip2 = { amount: 0.2, note: '#test1234', url: 'example.com', onTip: true };

describe('Test cases for tip page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Open and components are present, validate tip details, return to account, persist tip details', () => {
    cy.openTip()
      .get('[data-cy=send-tip]')
      .should('be.visible')
      .get('.url-bar')
      .should('exist')
      .get('[data-cy=textarea]')
      .should('be.visible')
      .get('[data-cy=input-number]')
      .should('be.visible')
      .get('[data-cy=amount-currency]')
      .should('be.visible')
      .buttonShouldBeDisabled('[data-cy=send-tip]')

      .buttonShouldBeDisabled('[data-cy=send-tip]')
      .enterTipDetails({ url: tip.url })
      .buttonShouldBeDisabled('[data-cy=send-tip]')
      .enterTipDetails({ amount: tip.amount })
      .buttonShouldBeDisabled('[data-cy=send-tip]')
      .enterTipDetails({ note: tip.note })
      .buttonShouldBeDisabled('[data-cy=send-tip]')
      .enterTipDetails({ amount: 'asd' })
      .buttonShouldBeDisabled('[data-cy=send-tip]')
      .enterTipDetails({ note: '' })
      .buttonShouldBeDisabled('[data-cy=send-tip]')
      .enterTipDetails({ amount: 0.5 })
      .buttonShouldBeDisabled('[data-cy=send-tip]')
      .enterTipDetails({ amount: 0, note: tip.note })
      .buttonShouldBeDisabled('[data-cy=send-tip]')
      .enterTipDetails({ ...tip })
      .buttonShouldNotBeDisabled('[data-cy=send-tip]')

      .goBack()
      .get('[data-cy=tip-container]')
      .should('not.exist')
      .openTip()
      .get('[data-cy=input-number]')
      .should('have.value', tip.amount.toString())
      .get('[data-cy=textarea]')
      .should('have.value', tip.note);
  });

  it('Valid tip details, return to edit after in confirm page', () => {
    cy.toConfirmTip({ ...tip })
      .get('[data-cy=edit-tip]')
      .should('be.visible')
      .click()
      .get('[data-cy=edit-tip]')
      .should('not.exist')
      .get('[data-cy=input-number]')
      .should('have.value', tip.amount.toString())
      .get('[data-cy=textarea]')
      .should('have.value', tip.note)
      .toConfirmTip({ ...tip2 });
  });

  it('Redirect to tip page from success tip', () => {
    cy.sendTip({ ...tip })
      .get('[data-cy=to-tips]')
      .should('be.visible')
      .click()
      .get('[data-cy=tip-container]')
      .should('be.visible')
      .urlEquals('/tip');
  });

  it('Redirect to account page from success tip', () => {
    cy.sendTip({ ...tip })
      .get('[data-cy=to-dashboard]')
      .should('be.visible')
      .click()
      .get('[data-cy=balance-info]')
      .should('be.visible')
      .urlEquals('/account');
  });
});
