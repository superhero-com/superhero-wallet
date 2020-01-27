import {onBeforeLoad} from '../support/mock_chrome.js';
import {login} from '../login';
import { transaction, connectObj } from '../utils';
import { convertToAE } from '../../../src/popup/utils/helper';

const showPendingTxPage = () => {
    login();
    cy
    .visit('popup/popup.html',{onBeforeLoad:(contentWindow) => { onBeforeLoad(contentWindow,'sign') }})
}

const showConnectConfirmPage = () => {
    login();
    cy
    .visit('popup/popup.html',{onBeforeLoad:(contentWindow) => { onBeforeLoad(contentWindow,'confirm-connection') }})
}

describe("Test cases for signing transactions from AEPP", () => {

    it("show pending transaction and have tx info", () => {
        showPendingTxPage()
         cy
        .get('.spendTxDetailsList')
        .should('be.visible')
        .get('.btnFixed')
        .should('be.visible')
        .get('.spendAccountAddr')
        .should('be.visible')
        .get('.balanceSpend')
        .should('be.visible')
        .get('.balanceBig')
        .should('be.visible')
        .get('.balanceTotalSpend')
    })

    it("validate tx info", () => {
        showPendingTxPage()
         cy
        .get('.accountFrom .spendAccountAddr')
        .should('contain','Main account')
        .get('.accountTo ul')
        .invoke('attr', 'title')
        .should('eq',transaction["abc"].tx.recipientId)
        .get('.balanceSpend')
        .should('contain',convertToAE(transaction["abc"].tx.amount))
        .get('.txFee')
        .should('be.visible')
        .get('.balanceTotalSpend')
        .should('be.visible')
    })

    it("hide setting menu and add tokens and accounts buttons", () => {
        showPendingTxPage()
         cy
        .get('#settings')
        .should('not.be.visible')
        .get('#account')
        .click()
        .get('.manageAccounts')
        .should('not.be.visible')
        .get('#account')
        .click()
        .get('#network')
        .click()
        .get('.manageAccounts')
        .should('not.be.visible')

    })

    it("click reject tx button redirect to account", () => {
        showPendingTxPage()
        cy
        .get('.reject')
        .click()
        .get('.ae-card.primary')
        .should('be.visible')
    })

    it("click confirm button create tx and sign it", () => {
        showPendingTxPage()
        cy
        .get('.confirm')
        .should('not.have.class','disabled')
        .click()
        .get('.ae-loader')
        .should('be.visible')
        .get('.ae-modal-light')
        .should('be.visible')
    })


    it("insufficient balance show alert", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad:(contentWindow) => { onBeforeLoad(contentWindow,'sign2') }})
        .get('.alert-card.primary')
        .should('be.visible')
        .get('.confirm')
        .should('have.class','disabled')
    })

    it("show confirm connect page", () => {
        showConnectConfirmPage()
        cy
        .get('.identiconContainer')
        .should('be.visible')
        .get('.btnFixed')
        .should('be.visible')
    })

    it("validate data show properly", () => {
        showConnectConfirmPage()
        cy
        .get('.accountName').eq(0)
        .should('contain', connectObj.params.title)
        .get('.hostname')
        .should('contain', connectObj.params.hostname )
        .get('h2 .primary')
        .should('contain', connectObj.params.title)
    })
    
    it("hide setting menu and add tokens and accounts buttons", () => {
        showConnectConfirmPage()
         cy
        .get('#settings')
        .should('not.be.visible')
        .get('#account')
        .click()
        .get('.manageAccounts')
        .should('not.be.visible')
        .get('#account')
        .click()
        .get('#network')
        .click()
        .get('.manageAccounts')
        .should('not.be.visible')

    })

    it("show login", () => {
        cy
        .visit('popup/popup.html',{ onBeforeLoad })
    })

});