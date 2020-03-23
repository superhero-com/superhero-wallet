const tip = { amount: 0.1, note: '#test', url: 'localhost:500' };
const tip2 = { amount: 0.1, note: '#test1234', url: 'localhost:500', onTip: true };

describe('Test cases for tip page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Open tip page', () => {
    cy.openTip();
  });

  it('Return to account', () => {
    cy.openTip()
      .goBack()
      .get('[data-cy=tip-container]')
      .should('not.be.visible');
  });

  it('Tip page components are present', () => {
    cy.openTip()
      .get('[data-cy=send-tip]')
      .should('be.visible')
      .get('[data-cy=tip-url]')
      .should('exist')
      .get('[data-cy=textarea]')
      .should('be.visible')
      .get('[data-cy=input-number]')
      .should('be.visible')
      .get('[data-cy=amount-currency]')
      .should('be.visible')
      .buttonShouldBeDisabled('[data-cy=send-tip]');
  });

  it('Validate tip details', () => {
    cy.openTip()
      .buttonShouldBeDisabled('[data-cy=send-tip]')
      .enterTipDetails({ url: tip.url })
      .buttonShouldBeDisabled('[data-cy=send-tip]')
      .enterTipDetails({ amount: tip.amount })
      .buttonShouldBeDisabled('[data-cy=send-tip]')
      .enterTipDetails({ note: tip.note })
      .buttonShouldNotBeDisabled('[data-cy=send-tip]')
      .enterTipDetails({ amount: 'asd' })
      .buttonShouldBeDisabled('[data-cy=send-tip]')
      .enterTipDetails({ note: '' })
      .buttonShouldBeDisabled('[data-cy=send-tip]')
      .enterTipDetails({ amount: 0.5 })
      .buttonShouldBeDisabled('[data-cy=send-tip]')
      .enterTipDetails({ amount: 0, note: tip.note })
      .buttonShouldBeDisabled('[data-cy=send-tip]')
      .enterTipDetails({ ...tip })
      .buttonShouldNotBeDisabled('[data-cy=send-tip]');
  });

  it('Persist tip details', () => {
    cy.openTip()
      .enterTipDetails({ ...tip })
      .goBack()
      .openTip()
      .get('[data-cy=input-number]')
      .should('have.value', tip.amount.toString())
      .get('[data-cy=textarea]')
      .should('have.value', tip.note);
  });

  it('Edit url disable button', () => {
    cy.openTip()
      .get('[data-cy=edit-url]')
      .click()
      .buttonShouldBeDisabled('[data-cy=send-tip]');
  });

  it('Valid tip details open confirm', () => {
    cy.toConfirmTip({ ...tip });
  });

  it('Return to edit after in confirm page', () => {
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

  it('Send tip', () => {
    cy.sendTip({ ...tip });
  });

  it('Redirect to tip page from success tip', () => {
    cy.sendTip({ ...tip })
      .get('[data-cy=to-tips]')
      .should('be.visible')
      .click()
      .get('[data-cy=tip-container]')
      .should('be.visible')
      .url()
      .should('eq', `${Cypress.config().popupUrl}/popup#/tip`);
  });

  it('Redirect to account page from success tip', () => {
    cy.sendTip({ ...tip })
      .get('[data-cy=to-dashboard]')
      .should('be.visible')
      .click()
      .get('[data-cy=balance-info]')
      .should('be.visible')
      .url()
      .should('eq', `${Cypress.config().popupUrl}/popup#/account`);
  });
});
