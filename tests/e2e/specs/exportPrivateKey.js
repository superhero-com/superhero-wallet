import {onBeforeLoad} from '../support/mock_chrome.js';
import {login} from '../login';
import { ACCOUNT_PASSWORD, PRIVATE_KEY } from '../utils';

const showExportPage = () => {
    login()
    cy
    .visit('popup/popup.html',{ onBeforeLoad })
    .get('#settings')
    .click()
    .get('.settings')
    .click()
    .get('.securitysett')
    .click()
    .get('.decryptKey')
    .should('be.visible')
}

describe("Export private key", () => {

    it("shows export private key page", () => {
        showExportPage()
    })

    it("click decrypt button shows modal", () => {
        showExportPage()
        cy
        .get('.decryptKey .settingBtn')
        .click()
        .get('.ae-modal')
        .should('be.visible')
    })

    it("click decrypt button shows modal and close modal", () => {
        showExportPage()
        cy
        .get('.decryptKey .settingBtn')
        .click()
        .get('.ae-modal')
        .should('be.visible')
        .get('.ae-modal .ae-header .ae-button')
        .click()
        .get('.ae-modal')
        .should('not.be.visible')
    })

    it("enter wrong password show error", () => {
        showExportPage()
        cy
        .get('.decryptKey .settingBtn')
        .click()
        .get('.ae-modal .ae-input')
        .type("1234")
        .get('.ae-modal .decrypt-btn')
        .click()
        .get('.alert-card.primary')
        .should('be.visible')
    })

    it("enter right password show private key", () => {
        showExportPage()
        cy
        .get('.decryptKey .settingBtn')
        .click()
        .get('.ae-modal .ae-input')
        .type(ACCOUNT_PASSWORD)
        .get('.ae-modal .decrypt-btn')
        .click()
        .get('.alert-card.alternative')
        .should('be.visible')
        .should('contain',PRIVATE_KEY)
    })

    it("decrypt private key then copy hides the private key", () => {
        showExportPage()
        cy
        .get('.decryptKey .settingBtn')
        .click()
        .get('.ae-modal .ae-input')
        .type(ACCOUNT_PASSWORD)
        .get('.ae-modal .decrypt-btn')
        .click()
        .get('.alert-card.alternative')
        .should('be.visible')
    })

    it("decrypt private key then close and open again", () => {
        showExportPage()
        cy
        .get('.decryptKey .settingBtn')
        .click()
        .get('.ae-modal .ae-input')
        .type(ACCOUNT_PASSWORD)
        .get('.ae-modal .decrypt-btn')
        .click()
        .get('.alert-card.alternative')
        .should('be.visible')
        .get('.ae-modal .ae-header .ae-button')
        .click()
        .get('.decryptKey .settingBtn')
        .click()
        .get('.alert-card.alternative')
        .should('not.be.visible') 
    })

    it("open login", () => {
        cy.visit('popup/popup.html',{onBeforeLoad})
    })
    
})