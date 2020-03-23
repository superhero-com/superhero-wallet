describe('Test cases for import account page', () => {
  beforeEach(() => {
    cy.openPopup();
  });

  it('Open import account page', () => {
    cy.openImportWallet()
      .get('textarea')
      .should('be.visible')
      .get('[data-cy=import]')
      .should('be.visible')
      .should('have.class', 'disabled');
  });

  it('Rreturn to index', () => {
    cy.openImportWallet()
      .get('[data-cy=back-arrow]')
      .click()
      .get('textarea')
      .should('not.be.visible')
      .get('[data-cy=checkbox]')
      .should('be.visible');
  });

  it('Wrong seed shows error message', () => {
    cy.enterSeedPhrase('test')
      .inputShouldHaveError('textarea')
      .shouldHasErrorMessage('.error-msg')
      .buttonShouldBeDisabled('[data-cy=import]');
  });

  it('Wrong seed shows error message', () => {
    cy.enterSeedPhrase('gentle kid gap')
      .inputShouldHaveError('textarea')
      .shouldHasErrorMessage('.error-msg')
      .buttonShouldBeDisabled('[data-cy=import]');
  });

  it('Enter correct seed redirects to account', () => {
    cy.enterSeedPhrase('media view gym mystery all fault truck target envelope kit drop fade')
      .get('[data-cy=balance-info]')
      .should('be.visible');
  });

  it('Enter seed phrase with spaces redirects to account', () => {
    cy.enterSeedPhrase(' media view gym mystery all fault truck target envelope kit drop fade ')
      .get('[data-cy=balance-info]')
      .should('be.visible');
  });
});
