import {onBeforeLoad} from '../support/mock_chrome.js';
import {login} from '../login';
import { Crypto } from '@aeternity/aepp-sdk/es';
import { account, generateHdWallet, getHdWalletAccount } from '../utils';
import { assert } from 'chai'

const openSVmessagePage = () => {
    login();
    cy
    .visit("popup/popup.html",{onBeforeLoad})
    .get('#settings')
    .click()
    .get('.dropdown-holder')
    .should('be.visible')
    .get('#utilities')
    .should('be.visible')
    .click()
    .get('.dropdown-holder')
    .should('not.be.visible')
    .get('.settingslist')
    .should('be.visible')
    .get('.sign-verify-messages')
    .should('be.visible')
    .click()
}

const wallet = generateHdWallet(account.secretKey);
const privKey = getHdWalletAccount(wallet,0).secretKey


const publicKeyWithPrefix = 'ak_d45oN2qzS1vqdiWVYCfDeWLVb3EepWxAJrsDbCSmnYiZguerw'
const publicKey = Buffer.from(Crypto.decodeBase58Check(publicKeyWithPrefix.split('_')[1]))

const message = 'test'

const signature = 
{
    "text":"test",
    "sig": {
        "0":115,"1":150,"2":30,"3":6,"4":127,"5":58,"6":218,"7":248,"8":42,"9":147,"10":118,"11":249,"12":82,"13":84,"14":27,"15":61,"16":34,"17":13,"18":120,"19":86,"20":69,"21":161,"22":115,"23":35,"24":82,"25":191,"26":31,"27":207,"28":27,"29":47,"30":187,"31":98,"32":106,"33":2,"34":108,"35":173,"36":195,"37":49,"38":156,"39":154,"40":206,"41":139,"42":92,"43":140,"44":79,"45":77,"46":77,"47":125,"48":139,"49":227,"50":119,"51":255,"52":231,"53":36,"54":128,"55":230,"56":41,"57":108,"58":133,"59":143,"60":60,"61":62,"62":24,"63":9
    }
}
const stringedsignature = JSON.stringify(signature);

const signMessage = () => {
    cy
        .get('.signPage')
        .should('be.visible')
        .click()
        .get('.signature-modal-buttons > .signMsg-copy')
        .click()
        .get('p.error')
        .should('contain','Please enter valid password!')
        .wait(5000)
        .should('contain','')
        .get('.ae-input')
        .type('asd')
        .get('.signature-modal-buttons > .signMsg-copy')
        .click()
        .get('p.error')
        .should('contain','Incorrect password!')
        .wait(5000)
        .should('contain','')
        .get('.ae-input')
        .clear()
        .type('qwerty')
        .get('.signature-modal-buttons > .signMsg-copy')
        .click()
        .get('h4')
        .should('contain','Sign message')
        .should('be.visible')
        .get('.ae-button')
        .should('have.class','disabled')
        .should('be.visible')
        .get('.ae-textarea')
        .should('be.visible')
        .type(message)
        .get('.ae-button')
        .should('not.have.class','disabled')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        const sign = Crypto.signPersonalMessage(message, privKey)
        const json = JSON.stringify( { text: message, sig: sign } );
        cy
        .get('.signedmsg-modal').then(el => {
            expect(json).to.eql(el[0].innerHTML)
        })
        cy
        .wait(3000)
        .get('.signMsg-cancel')
        .click()
        .get('.ae-modal-light')
        .should('not.be.visible')
        .get('.ae-textarea')
        .clear()
        .get('.ae-button')
        .should('have.class','disabled')
}

const verifyMessage = () => {
    cy
    .get('.backbutton')
    .click()
    .get('.verifyPage')
    .should('be.visible')
    .click()
    .get('h4')
    .should('contain','Verify message')
    .should('be.visible')
    .get('.ae-button')
    .should('have.class','disabled')
    .should('be.visible')
    .get('.ae-textarea')
    .should('be.visible')
    .type('asd')
    .get('.ae-button')
    .click()
    .get('.ae-modal-light').should('be.visible').get('h1').should('contain','Incorrect fields').get('.buttons > .ae-button').click() //close alert modal
    .get('.ae-textarea')
    .clear()
    .type('123')
    .get('.ae-button')
    .click()
    .get('.ae-modal-light').should('be.visible').get('h1').should('contain','Incorrect fields').get('.buttons > .ae-button').click() //close alert modal
    .get('.ae-textarea')
    .clear()
    .type(stringedsignature, { parseSpecialCharSequences: false })
    .get('.ae-button')
    .click().then(() => {
        let verObj = JSON.parse(stringedsignature);
        var signature = new Uint8Array(Object.values(verObj.sig));
        const result = Crypto.verifyPersonalMessage(message, signature, publicKey)
        assert.isTrue(result)
        
    });

}

describe("Test cases for Allowances Page", () => {
    it("open Utilities page then Allowances page and back to account", () => {
        openSVmessagePage();
        cy
        .get('.backbutton')
        .should('be.visible')
        .click()
        .get('.backbutton')
        .should('be.visible')
        .click()
        .get('.ae-card.primary')
        .should('be.visible')
    });

    it("open sign message page, type password with validation and then sign message", () => {
        openSVmessagePage();
        signMessage();
    });

    it("sign message and then verify it", () => {
        openSVmessagePage();
        signMessage();
        verifyMessage();
    });
});