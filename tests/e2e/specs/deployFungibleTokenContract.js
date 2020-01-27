import { onBeforeLoad } from '../support/mock_chrome.js';
import { login,loginAndLogout } from '../login';
import { ACCOUNT_PASSWORD } from '../utils'

const openCreateContractPage = () => {
    login()
    cy
    .visit('popup/popup.html',{ onBeforeLoad })
    .get('.ae-loader')
    .should('not.be.visible')
    .get('#settings')
    .click()
    .get('.utilities')
    .click()
    .get('.fungible-tokens')
    .click()
    .get('.create-token')
    .click()
}

const createToken = () => {
    openCreateContractPage()
    cy
    .get('.token-name')
    .type('TST')
    .get('.token-symbol')
    .type('TST')
    .get('.token-precision')
    .clear()
    .type(2)
    .get('.confirmTx')
    .click()
    .get('.spendTxDetailsList')
    .should('be.visible')
}

describe("tests for creating fungible token contract", () => {

    it("opens create page", () => {
        openCreateContractPage()
    })

    it("validate token name", () => {
        openCreateContractPage()
        cy
        .get('.confirmTx')
        .click()
        .get('.token-name-holder .ae-toolbar')
        .should('be.visible')
        .get('.token-name')
        .type('12345678910123')
        .get('.confirmTx')
        .click()
        .get('.token-name-holder .ae-toolbar')
        .should('not.be.visible')
    })

    it("validate token symbol", () => {
        openCreateContractPage()
        cy
        .get('.token-name')
        .type('TST')
        .get('.confirmTx')
        .click()
        .get('.token-symbol-holder .ae-toolbar')
        .should('be.visible')
        .get('.token-symbol')
        .type('12345678910123')
        .get('.confirmTx')
        .click()
        .get('.token-symbol-holder .ae-toolbar')
        .should('be.visible')
        .get('.token-symbol')
        .clear()
        .type('TST')
        .get('.confirmTx')
        .click()
        .get('.token-symbol-holder .ae-toolbar')
        .should('not.be.visible')
    })

    it("validate token precision", () => {
        openCreateContractPage()
        cy
        .get('.token-name')
        .type('TST')
        .get('.token-symbol')
        .type('TST')
        .get('.confirmTx')
        .click()
        .get('.token-precision-holder .ae-toolbar')
        .should('be.visible')
        .get('.token-precision')
        .clear()
        .type(38)
        .get('.confirmTx')
        .click()
        .get('.token-precision-holder .ae-toolbar')
        .should('be.visible')
        .get('.token-precision')
        .clear()
        .type(2)
        .get('.confirmTx')
        .click()
        .get('.token-precision-holder .ae-toolbar')
        .should('not.be.visible')
        .get('.spendTxDetailsList')
        .should('be.visible')
    })


    it("show confirm token create tx and reject", () => {
         createToken()
         cy
        .get('.spendAccountAddr')
        .should('contain', 'New contract')
        .get('.ae-badge')
        .should('contain','Contract Create')
        .get('.balanceSpend')
        .should('contain','0 AE')
        .get('.range-slider')
        .should('be.visible')
        .get('.reject')
        .click()
        .get('.spendTxDetailsList')
        .should('not.be.visible')
        .get('.ae-card.primary')
        .should('be.visible')
    })

    it("create token and check token present", () => {
        createToken()
        cy
        .get('.confirm')
        .should('not.have.class','disabled')
        .click()
        .get('.ae-loader')
        .should('be.visible')
        .get('.ae-modal-light')
        .should('be.visible')
        .get('.ae-modal-light .buttons button')
        .click()
        .get('.ae-modal-light')
        .should('not.be.visible')
        .get('.ae-card.primary')
        .should('be.visible')
        .get('#settings')
        .click()
        .get('#tokens')
        .click()
        .get('#tokens .tokenBalance')
        .should('contain', 'TST')
    })

    it("create token logout and login and check token present", () => {
        createToken()
        cy
        .get('.confirm')
        .should('not.have.class','disabled')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('.ae-modal-light .buttons button')
        .click()
        .get('.ae-modal-light')
        .should('not.be.visible')
        .get('#settings')
        .click()
        .get('.toLogout')
        .click()
        .get('input[type=password]').type(ACCOUNT_PASSWORD)
        .get('button')
        .contains('Login')
        .click()
        .get('#settings')
        .click()
        .get('#tokens')
        .click()
        .get('#tokens .tokenBalance')
        .should('contain', 'TST')
    })

    it("open login", () => {
        cy.visit('popup/popup.html',{onBeforeLoad})
    })

})