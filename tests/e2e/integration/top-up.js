describe('Test cases for Top Up Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Go to top-up Page', () => {
    cy.get('[data-cy=hamburger]')
      .click()
      .menuShould('be.visible')
      .get('[data-cy=receive]')
      .click()
      .get('[data-cy=top-up-container]')
      .should('be.visible');
  });

  it('Check Home button', () => {
    cy.get('[data-cy=hamburger]')
      .click()
      .menuShould('be.visible')
      .get('[data-cy=receive]')
      .click()
      .get('[data-cy=home]')
      .click();
  });

  it('Check copy button', () => {
    cy.get('[data-cy=hamburger]')
      .click()
      .menuShould('be.visible')
      .get('[data-cy=receive]')
      .click()
      .get('[data-cy=copy]')
      .click()
      .get('.copied-alert')
      .should('contain', 'Copied!');
  });

  it('Check Claim-Name Button', () => {
    cy.get('[data-cy="account-name"]')
      .should('be.visible')
      .click()
      .get('[data-cy=names-container]')
      .should('be.visible');
  });
});
