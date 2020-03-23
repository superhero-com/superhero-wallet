describe('Test cases for Front Page', () => {
  beforeEach(() => {
    cy.openPopup();
  });

  it('Have terms checkbox', () => {
    cy.get('[data-cy=checkbox]').should('be.visible');
  });

  it('Buttons are disabled', () => {
    cy.buttonShouldBeDisabled('[data-cy=generate-wallet]').buttonShouldBeDisabled('[data-cy=import-wallet]');
  });

  it('Have create/import wallet buttons', () => {
    cy.get('[data-cy=generate-wallet]').should('be.visible');
    cy.get('[data-cy=import-wallet]').should('be.visible');
  });

  it('Terms agree activate buttons', () => {
    cy.termsAgree()
      .buttonShouldNotBeDisabled('[data-cy=generate-wallet]')
      .buttonShouldNotBeDisabled('[data-cy=import-wallet]');
  });

  it('Terms uncheck disable buttons', () => {
    cy.termsAgree()
      .termsAgree()
      .buttonShouldBeDisabled('[data-cy=generate-wallet]')
      .buttonShouldBeDisabled('[data-cy=import-wallet]');
  });

  it('Open terms and conditions', () => {
    cy.openTerms()
      .get('[data-cy=terms]')
      .should('not.exist');
  });

  it('Open generate wallet page', () => {
    cy.openGenerateWallet()
      .get('[data-cy=generate-wallet]')
      .should('not.exist');
  });

  it('Open import wallet page', () => {
    cy.openImportWallet()
      .get('[data-cy=import-wallet]')
      .should('not.exist');
  });
});
