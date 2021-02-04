describe('Test cases for import account page', () => {
  beforeEach(() => {
    cy.logout().openPopup();
  });

  it('Opens import account page, shows error on wrong seed, returns to index', () => {
    cy.openImportWallet()
      .get('textarea')
      .should('be.visible')
      .get('[data-cy=import]')
      .should('be.visible')
      .should('have.class', 'disabled')

      .enterSeedPhrase('test')
      .inputShouldHaveError('textarea')
      .shouldHasErrorMessage('.error-msg')
      .buttonShouldBeDisabled('[data-cy=import]')

      .enterSeedPhrase('gentle kid gap')
      .inputShouldHaveError('textarea')
      .shouldHasErrorMessage('.error-msg')
      .buttonShouldBeDisabled('[data-cy=import]')

      .goBack()
      .get('textarea')
      .should('not.exist')
      .get('[data-cy=checkbox]')
      .should('be.visible');
  });

  it('Enter correct seed redirects to account', () => {
    cy.openAndEnterSeedPhrase(
      'media view gym mystery all fault truck target envelope kit drop fade',
    )
      .get('[data-cy=balance-info]')
      .should('be.visible');
  });

  it('Enter seed phrase with spaces redirects to account', () => {
    cy.openAndEnterSeedPhrase(
      ' media view gym mystery all fault truck target envelope kit drop fade ',
    )
      .get('[data-cy=balance-info]')
      .should('be.visible');
  });
});
