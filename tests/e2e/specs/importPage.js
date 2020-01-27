import {onBeforeLoad} from '../support/mock_chrome.js';
import {login} from '../login';
import {prepareEncryptedPrivateKey, ACCOUNT_PASSWORD,ACCOUNT_PASSWORD_STRONG, PRIVATE_KEY, mnemonic} from '../utils.js';

describe('Test cases for Import private key and seed phrase', () => {

    it('show import modal', () => {
        cy.visit('popup/popup.html',{onBeforeLoad});
        cy.get('button.importBtn').click();
        cy.get('.ae-overlay').should('be.visible');
        cy.get('.ae-modal').should('be.visible');
        cy.get('.ae-modal button').should('contain','Continue');
        cy.get('.ae-modal .ae-input').should('be.visible');
        cy.get('.mobile-right button').should('be.visible').click();
        cy.get('.ae-modal').should('not.be.visible');
        cy.get('.ae-overlay').should('not.be.visible');
    });

    it('import from private key', () => {
        cy.visit('popup/popup.html',{onBeforeLoad});
        cy.get('button.importBtn').click();
        cy.get('.ae-overlay').should('be.visible');
        cy.get('.ae-modal').should('be.visible');
        cy.get('.ae-modal input').type('1234');
        cy.get('.ae-modal button').contains('Continue').click();
        cy.get('.ae-modal .ae-toolbar').should('contain','Private key is incorrect!');
        cy.get('.ae-modal input').clear();
        cy.get('.ae-modal input').type(PRIVATE_KEY);
        cy.get('.ae-modal button').contains('Continue').click();
        cy.get('h3').should('contain','Import From Private Key');
        cy.get('input[type="password"]').should('be.visible');
        cy.get('button').contains('Import').should('be.visible');
        cy.get('input[type="password"]').eq(0).type('1234');
        cy.get('button').contains('Import').click();
        cy.get('.ae-toolbar').should('contain',"Too weak password");
        cy.get('input[type="password"]').eq(0).clear();
        cy.get('input[type="password"]').eq(0).type(ACCOUNT_PASSWORD_STRONG);
        cy.get('input[type="password"]').eq(1).type(ACCOUNT_PASSWORD_STRONG + "as");
        cy.get('button').contains('Import').click();
        cy.get('.ae-toolbar').should('contain',"Password does not match!");
        cy.get('input[type="password"]').eq(0).clear().type(ACCOUNT_PASSWORD_STRONG);
        cy.get('input[type="password"]').eq(1).clear().type(ACCOUNT_PASSWORD_STRONG);
        cy.get('button').contains('Import').click();
        cy.get('.ae-loader').should('be.visible');
        cy.get('.ae-card')
        .should('be.visible')
        .get('.ae-header')
        .should('have.class','logged')
        .get('#settings')
        .should('be.visible');
    });

    it("import from seed phrase", () => {
        cy.visit('popup/popup.html',{onBeforeLoad});
        cy.get('button.importBtn').click();
        cy.get('.ae-overlay').should('be.visible');
        cy.get('.ae-modal').should('be.visible');
        cy.get('.tabs span').eq(2).click();
        cy.get('p').should('contain','Enter your seed phrase');
        cy.get('textarea').should('be.visible');
        cy.get('button').contains('Continue').should('be.visible');
        cy.get('textarea').type('qwerty');
        cy.get('button').contains('Continue').click();
        cy.get('.ae-toolbar').should('contain','Incorrect seed phrase!');
        cy.get('textarea').clear().type('plug leave parade earn mosquito laptop this alpha donate recipe cancel')
        cy.get('button').contains('Continue').click();
        cy.get('.ae-toolbar').should('contain','Incorrect seed phrase!');
        cy.get('textarea').clear().type('plug leave parade earn mosquito laptop this alpha donate recipe cancel access');
        cy.get('button').contains('Continue').click();
        cy.get('h3').should('contain','Import From Seed Phrase');
        cy.get('input[type="password"]').should('be.visible');
        cy.get('button').should('be.visible').should('contain','Restore');
        cy.get('input[type="password"]').eq(0).type('1234');
        cy.get('button').contains('Restore').click();
        cy.get('.ae-toolbar').should('contain',"Too weak password");

        cy.get('input[type="password"]').eq(0).type(ACCOUNT_PASSWORD_STRONG);
        cy.get('input[type="password"]').eq(1).type(ACCOUNT_PASSWORD_STRONG + "as");
        cy.get('button').contains('Restore').click();
        cy.get('.ae-toolbar').should('contain',"Password does not match!");

        cy.get('input[type="password"]').eq(0).clear().type(ACCOUNT_PASSWORD_STRONG);
        cy.get('input[type="password"]').eq(1).clear().type(ACCOUNT_PASSWORD_STRONG);
        cy.get('button').contains('Restore').click();
        cy.get('.ae-loader').should('be.visible')
        cy.get('.ae-card')
        .should('be.visible')
        .get('.ae-header')
        .should('have.class','logged')
        .get('#settings')
        .should('be.visible');
    });


   
});