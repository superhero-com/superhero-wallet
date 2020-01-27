import {onBeforeLoad} from '../support/mock_chrome.js';
import {login,loginAndLogout} from '../login';
import {ACCOUNT_PASSWORD,account} from '../utils';
import { equal } from 'assert';

describe("Test cases for Account Page" , () => {
    it('change network', () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad})
        .get('.ae-loader')
        .should('not.be.visible')
        .wait(2000)
        .get('.ae-card-header p')
        .should((elem) => {
            expect(elem.text()).not.to.equal('0 AE')
        })
        .get('#network')
        .click()
        .get('.dropdown-holder')
        .should('be.visible')
        .get('.dropdown-holder li').eq(0)
        .should('have.class','activeAccount')
        .get('.dropdown-holder li').eq(1)
        .click()
        .wait(1000)
        .get('.dropdown-holder')
        .should('not.be.visible')
        .get('#network')
        .click()
        .get('.dropdown-holder')
        .should('be.visible')
        .get('.dropdown-holder li').eq(1)
        .should('have.class','activeAccount')
        .get('#network')
        .click()
        .get('.dropdown-holder')
        .should('not.be.visible') 
        .get('.noTransactions')
        .should('be.visible')
        .get('.ae-card-header p')
        .should('contain', '0 AE')
    });

    it("have settings menu", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad})
        .get('#settings')
        .should('be.visible')
    });

    it("have accounts menu", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad})
        .get('#account')
        .should('be.visible')
    }); 

    it("have switch network menu", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad})
        .get('#network')
        .should('be.visible')
    }); 

    it("show accounts submenu ", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad})
        .get('#account')
        .should('be.visible')
        .click()
        .get('.dropdown-holder')
        .should('be.visible')
        .get('.newSubaccount')
        .should('be.visible')
    }); 

    
    it("open manage accounts page", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad})
        .get('#account')
        .click()
        .get('.dropdown-holder')
        .should('be.visible')
        .get('.manageAccounts > .triggerhidedd > .newSubaccount').eq(0)
        .click()
        .get('.dropdown-holder')
        .should('not.be.visible')
        .get('#manageAccounts')
        .should('be.visible')
    }); 
    
    it("open Utilities page", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad})
        .get('#settings')
        .click()
        .get('.dropdown-holder')
        .should('be.visible')
        .get('#utilities')
        .should('be.visible')
        .click()
        .wait(1000)
        .get('.dropdown-holder')
        .should('not.be.visible')
        .get('#utilitiesPage')
        .should('be.visible')
    });


    it('check latests 3 transactions', () => {
        login();
        cy.visit('popup/popup.html',{onBeforeLoad})
        .get('.ae-card-header p')
        .get('.transactionList')
        .children()
        .its('length')
        .should('be.eq',3)
        .get('.transactionHistory')
        .should('be.visible')
        .should('have.class','primary')
    });

    /* not working for now problems with cors on main network */
    it("switch network check latest 3 transactions", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad})
        .get('#network')
        .click()
        .get('.dropdown-holder')
        .should('be.visible')
        .get('.dropdown-holder li button').eq(1)
        .click()
    });
});