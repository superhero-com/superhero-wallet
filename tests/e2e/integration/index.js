describe('Test cases for Front Page', () => {
  it('Opens Index page, agrees, disagrees on terms, opens generate and import wallets', () => {
    cy.openPopup()
      .get('[data-cy=checkbox]')
      .should('be.visible')

      .buttonShouldBeDisabled('[data-cy=generate-wallet]')
      .buttonShouldBeDisabled('[data-cy=import-wallet]')

      .get('[data-cy=generate-wallet]')
      .should('be.visible')
      .get('[data-cy=import-wallet]')
      .should('be.visible')

      .termsAgree()
      .buttonShouldNotBeDisabled('[data-cy=generate-wallet]')
      .buttonShouldNotBeDisabled('[data-cy=import-wallet]')

      .termsAgree()
      .buttonShouldBeDisabled('[data-cy=generate-wallet]')
      .buttonShouldBeDisabled('[data-cy=import-wallet]')

      .openTerms()
      .get('[data-cy=terms]')
      .should('not.exist')

      .goBack()
      .goBack()
      .openImportWallet()
      .get('[data-cy=import-wallet]')
      .should('not.exist')

      .goBack()
      .openGenerateWallet()
      .get('[data-cy=generate-wallet]')
      .should('not.exist');
  });
});
