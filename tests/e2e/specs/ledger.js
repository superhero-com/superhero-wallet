import { onBeforeLoad } from '../support/mock_chrome.js';
import { login } from '../login';


describe("Test cases for Ledger", () => {

    it("show ledger setup page", () => {
        login()
        cy
        .visit("popup/popup.html",{onBeforeLoad})
        .get('#account')
        .click()
        .get('#account .ledger.manageAccounts')
        .click()
        .get('.ae-panel')
        .should('be.visible')
        .get('.ae-panel .newSubaccount')
        .should('be.visible')
        .click()
    })

    it("iframe is injected", () => {
        login()
        cy
        .get('iframe')
        .should('have.attr','src','https://waellet.com/ledger.html')
    })

    it("open login", () => {
        cy
        .visit("popup/popup.html",{onBeforeLoad})
    })
})