import { onBeforeLoad } from '../support/mock_chrome.js';
import { login,loginAndLogout } from '../login';

const openNamesPage = () => {
    login({}, 'account2')
    cy
    .get('#settings')
    .click()
    .get('.settings')
    .click()
    .get('.generalsett')
    .click()
    .wait(4000)
}

const preclaimName = () => {
    openNamesPage()
    cy
    .get('.checkName input')
    .type(name)
    .get('.regbtn')
    .click()
    .get('.spendTxDetailsList')
    .should('be.visible') 
    .get('.spendAccountAddr')
    .should('contain','AENS')
    .get('.ae-badge')
    .should('contain','Name Preclaim')
    .get('.range-slider')
    .should('be.visible')
}

const claimName = () => {
    preclaimName()
    cy
    .get('.confirm')
    .should('not.have.class','disabled')
    .click()
    .get('.ae-loader')
    .should('be.visible')
    .get('.spendTxDetailsList')
    .should('be.visible')
    .get('.spendAccountAddr')
    .should('contain','AENS')
    .get('.ae-badge')
    .should('contain','Name Claim')
    .get('.range-slider')
    .should('be.visible')
}


const makeid = (length) => {
    var result           = '';
    var characters       = 'BCDEFGHIJKLMNOPQRSTUVWXYZbcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const name = makeid(5)

describe("tests cases for registering names ", () => {

    it("open create name page", () => {
        openNamesPage()
        cy
        .get('.checkName')
        .should('be.visible')
        .get('.maindiv_input-group-addon')
        .should('be.visible')
    })

    it("validate name exist", () => {
        openNamesPage()
        cy
        .get('.checkName input')
        .type("testw123.test")
        .get('.regbtn')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
    })

    it("check if registered name is present in list", () => {
        openNamesPage()
        cy
        .get('.allAENS')
        .should('be.visible')
        .click()
        .get('.seeAllRegisteredNames')
        .should('be.visible')
        .get('.subAccountName')
        .should('contain','alabala.test')
    })

    it("show preclaim confirm tx", () => {
        preclaimName()
    })

    it("preclaim name tx reject", () => {
        preclaimName()
        cy
        .get('.reject')
        .click()
        .get('.spendTxDetailsList')
        .should('not.be.visible')
        .get('.ae-card.primary')
        .should('be.visible')
    })

    it("preclaim name tx confirm and show claim tx", () => {
        claimName()
    })

    it("claim tx reject", () => {
        claimName()
        cy
        .get('.reject')
        .click()
        .get('.spendTxDetailsList')
        .should('not.be.visible')
        .get('.ae-card.primary')
        .should('be.visible')
    })

    it("claim tx confirm and check if name present in list", () => {
        claimName()
        cy
        .get('strong')
        .should('contain', name)
        .get('.confirm')
        .should('not.have.class','disabled')
        .click()
        .get('.ae-loader')
        .should('be.visible')
        .get('.spendTxDetailsList')
        .should('not.be.visible')
        .get('.allAENS')
        .should('be.visible')
        .click()
        .get('.seeAllRegisteredNames')
        .should('be.visible')
        .get('.subAccountName')
        .should('contain', name)
        .get('.name-pending')
        .should('be.visible')
        .get('.closeAllAENS')
        .click()
        .get('.seeAllRegisteredNames')
        .should('not.be.visible')
        .get('.dropdown-button-name')
        .should('contain',name)
        .get('#account')
        .click()
        .get('.dropdown-holder').eq(0).find('.name-pending')
        .should('be.visible')
    })

    it("open login", () => {
        cy.visit('popup/popup.html',{onBeforeLoad})
    })

})