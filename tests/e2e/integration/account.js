describe('Test cases for Account Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Checks dissapearing seed phrase backup button, opens/close sidebar, checks copy button, contains a claim name message', () => {
    cy.get('.seed-backup-notification')
      .should('be.visible')

      .openMenu()
      .menuShould('be.visible')
      .closeMenu()
      .menuShould('not.exist')

      .get('[data-cy=copy]')
      .click()
      .get('.copied-alert')
      .should('contain', 'Copied!')

      .get('[data-cy=account-name]')
      .should('be.visible')
      .contains('Register a name');
  });

  it('Check Claim-Name, Tip, View-All-Tancastions, Dropdown Buttons And Back to Account', () => {
    cy.get('[data-cy="account-name"]')
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
      .get('[data-cy=all-transactions]')
      .should('exist')
      .get('[data-cy="back-arrow"]')
      .click()

      .urlEquals('/account')
      .get('[data-cy=view-all-transactions]')
      .should('be.visible')
      .get('[data-cy=currency-dropdown] [data-cy=custom-dropdown]')
      .should('be.visible')
      .click()
      .get('[data-cy=currency-dropdown] [data-cy=custom-dropdown]')
      .should('have.class', 'show')
      .click()
      .get('[data-cy=currency-dropdown] [data-cy=custom-dropdown]')
      .should('not.have.class', 'show');
  });
});
