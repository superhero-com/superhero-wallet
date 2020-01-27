import {onBeforeLoad} from '../support/mock_chrome.js';
import {login} from '../login';

describe("Test cases for Receive Page", () => {

    it("open receive page", () => {
        login();
        cy
        .visit("popup/popup.html",{onBeforeLoad})
        .get('.receiveBtn')
        .click()
        .get('.ae-card.neutral')
        .should('be.visible')
        .get('.toAccount')
        .should('be.visible')
        .get('.ae-card button')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('.ae-overlay')
        .should('be.visible')
        .get('.ae-modal-light .buttons button')
        .click()
        .get('.ae-modal-light')
        .should('not.be.visible')
        .get('.ae-overlay')
        .should('not.be.visible')
    });

    it("open receive page and back to account", () => {
        login();
        cy
        .visit("popup/popup.html",{onBeforeLoad})
        .get('.receiveBtn')
        .click()
        .get('.ae-card.neutral')
        .should('be.visible')
        .get('.actions .toAccount')
        .should('be.visible')
        .click()
        .get('.ae-card.primary')
        .should('be.visible')
    });
});