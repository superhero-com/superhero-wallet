import { testAccount } from '../../../src/popup/utils/config'

describe("Tests cases for AEX-2 communication", () => {
  beforeEach(() => {
    cy.openAepp()
  })

  it("can connect to extension", () => {
      cy
      .get('[data-cy=wallet-address]')
      .should('be.visible')
      .should('contain', testAccount.publicKey)
      .get('[data-cy=wallet-balance]')
      .should('be.visible')
      .get('[data-cy=wallet-name]')
      .should('be.visible')
      .should('contain','SuperHero')
  })

  it("can sign message", () => {
    cy
    .get('[data-cy=wallet-sign-msg]')
    .should('be.visible')
    .click()
  })
  
})