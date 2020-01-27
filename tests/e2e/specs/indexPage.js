import {onBeforeLoad} from '../support/mock_chrome.js';
import {login} from '../login';
import {prepareEncryptedPrivateKey, ACCOUNT_PASSWORD, PRIVATE_KEY, mnemonic} from '../utils.js';

describe('Test cases for Index Page', () => {
    it('have import button', () => {
        cy.visit('popup/popup.html',{onBeforeLoad});
        cy.get('button').should('contain','Import secret key');
    });

    it('have generate wallet button', () => {
        cy.visit('popup/popup.html',{onBeforeLoad});
        cy.get('button').should('contain','Generate wallet');
    });


    it("have login button and logout", () => {
        prepareEncryptedPrivateKey();
        cy.visit('popup/popup.html',{onBeforeLoad:(contentWindow) => { onBeforeLoad(contentWindow,'account') }})
        .get('input[type="password"]')
        .should('be.visible')
        .get('.logo_top')
        .should('be.visible')
        .get('.ae-button').eq(0)
        .should('contain','Login')
        .get('input[type="password"]')
        .type("123")
        .get('.ae-button').eq(0)
        .click()
        .get('.ae-toolbar')
        .should('be.visible')
        .get('input[type="password"]')
        .clear()
        .type("1234")
        .get('.ae-button').eq(0)
        .click()
        .get('.ae-toolbar')
        .should('be.visible')
        .get('input[type="password"]')
        .clear()
        .type("qwerty")
        .get('.ae-button').eq(0)
        .click()
        .get('.ae-card')
        .should('be.visible')
        .get('#settings')
        .click()
        .get('.dropdown-holder')
        .should('be.visible')
        .wait(2000)
        .get('.toLogout')
        .click()
        .get('input[type="password"]')
        .should('be.visible')
        .get('.ae-header')
        .should('not.have.class','logged');
    });
    
    it('login', () => {
        login();
    });
});