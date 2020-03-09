Cypress.Commands.add('openPopup', () => {
  cy.visit('popup/popup.html')
})

Cypress.Commands.add('termsAgree', () => {
  cy
  .get('[data-cy=checkbox]')
  .click()
})

Cypress.Commands.add('generateWallet', () => {
  cy
  .termsAgree()
  .get('[data-cy=generate-wallet]')
  .click()
})

Cypress.Commands.add('importWallet', () => {
  cy
  .termsAgree()
  .get('[data-cy=import-wallet]')
  .click()
})