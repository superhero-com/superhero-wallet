Cypress.Commands.add('openPopup', () => {
  cy.visit('popup/popup.html')
})

Cypress.Commands.add('termsAgree', () => {
  cy
  .get('[data-cy=checkbox]')
  .click()
})

Cypress.Commands.add('openGenerateWallet', () => {
  cy
  .termsAgree()
  .get('[data-cy=generate-wallet]')
  .click()
})

Cypress.Commands.add('openImportWallet', () => {
  cy
  .termsAgree()
  .get('[data-cy=import-wallet]')
  .click()
})

Cypress.Commands.add('enterSeedPhrase', (seed) => {
  cy
  .openImportWallet()
  .get('textarea')
  .type(seed)
  .get('[data-cy=import]')
  .click()
})

Cypress.Commands.add('inputShouldHaveError', (input) => {
  cy
  .get(input)
  .should('have.class','has-error')
})

Cypress.Commands.add('buttonShouldBeDisabled', (button) => {
  cy
  .get(button)
  .should('have.class','disabled')
})

Cypress.Commands.add('buttonShouldNotBeDisabled', (button) => {
  cy
  .get(button)
  .should('not.have.class','disabled')
})

Cypress.Commands.add('shouldHasErrorMessage', (el) => {
  cy
  .get(el)
  .should('exist')
  .should('be.visible')
})