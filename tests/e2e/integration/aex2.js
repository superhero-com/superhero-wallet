import { testAccount } from '../../../src/popup/utils/config'

const messageSig = "f85fd998cdf48c96ddf52d3a62edc3245a196db97d6898a45083e74b587dae4ba5d4baa4c6c247e109af4930ca117b72f849732f6586782ca8845a11cbf6f400";
describe("Tests cases for AEX-2 communication", () => {
  beforeEach(() => {
    cy.openAepp()
  })


  console.log("browser",Cypress.browser)

  if(Cypress.browser.family === 'chromium' && Cypress.browser.isHeaded) {
    it("Connect to extension and get wallet info", () => {
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

    it("Sign message", () => {
      cy
      .get('[data-cy=wallet-sign-msg]')
      .should('be.visible')
      .click()
      .get('[data-cy=message-valid]')
      .should('be.visible')
      .should('contain',messageSig)
    })
  }
  



  
})