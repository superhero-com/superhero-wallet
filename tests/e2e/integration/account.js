describe('Test cases for Account Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Check if button for seed phrase backup disappear', () => {
    cy.get('[data-cy=seed-notif]').should('not.be.visible');
  });

  it('Sidebar open and close', () => {
    cy.openMenu()
      .menuShould('be.visible')
      .closeMenu()
      .menuShould('not.be.visible');
  });

  it('Check copy button', () => {
    cy.get('[data-cy=copy]')
      .click()
      .get('.copied-alert')
      .should('contain', 'Copied!');
  });

  it('Check How-to-claim Button', () => {
    cy.get('[data-cy=how-to-claim-button]')
      .should('be.visible')
      .click();
  });

  it('Check Claim-Name Button And Back to Account', () => {
    cy.get('[data-cy="account-name"]')
      .should('be.visible')
      .click()
      .get('[data-cy=names-container]')
      .should('be.visible')
      .get('[data-cy="back-arrow"]')
      .click()
      .get('[data-cy=how-to-claim-button]')
      .should('be.visible');
  });

  it('Check Tip Button And Back to Account', () => {
    cy.get('[data-cy=tip-button]')
      .should('be.visible')
      .click()
      .get('[data-cy=tip-container]')
      .should('be.visible')
      .get('[data-cy="back-arrow"]')
      .click()
      .get('[data-cy=how-to-claim-button]')
      .should('be.visible');
  });

  it('Check View-All-Transactions Button And Back to Account', () => {
    cy.get('[data-cy=view-all-transactions]')
      .should('be.visible')
      .click()
      .get('ul.allTransactions')
      .should('exist')
      .get('[data-cy="back-arrow"]')
      .click()
      .get('[data-cy=how-to-claim-button]')
      .should('be.visible');
  });

  it('Check Currency Dropdown Button And Back to Account', () => {
    cy.get('[data-cy=toggle-currency-dropdown]')
      .should('be.visible')
      .click()
      .get('#currencies')
      .should('have.class', 'show')
      .get('[data-cy=toggle-currency-dropdown]')
      .click()
      .get('#currencies')
      .should('not.have.class', 'show');
  });

  it('Account info contain claim name message', () => {
    cy.get('[data-cy=account-name]')
      .should('be.visible')
      .contains('Claim your .chain name');
  });
});
