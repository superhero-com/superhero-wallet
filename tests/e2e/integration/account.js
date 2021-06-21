describe('Test cases for Account Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Checks dissapearing seed phrase backup button, opens/close sidebar, checks copy button, contains a claim name message', () => {
    cy.get('.seed-backup-notification')
      .should('be.visible')

      .get('[data-cy=copy]')
      .click()
      .get('.copied > .text')
      .should('contain', 'Address copied')

      .get('[data-cy=claim-name]')
      .should('be.visible')
      .contains('Claim your .chain name');
  });

  it('Check Claim-Name, Tip, View-All-Tancastions, Dropdown Buttons And Back to Account', () => {
    cy.get('[data-cy="claim-name"]')
      .should('be.visible')
      .click()
      .get('[data-cy="back-arrow"]')
      .click()

      .get('[data-cy=tip-button]')
      .should('be.visible')
      .click()
      .get('[data-cy=tip-container]')
      .should('be.visible')
      .get('[data-cy="back-arrow"]')
      .click()

      .get('[data-cy=view-all-transactions]')
      .should('be.visible')
      .click()
      .get('[data-cy=list]')
      .should('exist')
      .get('[data-cy="back-arrow"]')
      .click()

      .urlEquals('/account')
      .get('[data-cy=view-all-transactions]')
      .should('be.visible')
      .get('[data-cy=currency-dropdown]')
      .should('be.visible')
      .click()
      .get('[data-cy=currency-dropdown]')
      .should('have.class', 'active')
      .click()
      .get('[data-cy=currency-dropdown]')
      .should('not.have.class', 'active');
  });
});
