import {onBeforeLoad} from '../support/mock_chrome.js';
import {login} from '../login';
import  { PUBLIC_KEY_SEND,account ,getLatestThreeTransactions} from '../utils';


describe("Test cases for Send Page", () => {
    it("open send page", () => {
        login();
        cy
        .visit("popup/popup.html",{onBeforeLoad})
        .get('.sendBtn')
        .click()
        .get('.address .ae-input')
        .should('be.visible')
        .get('.sendAmount')
        .should('be.visible')
        .get('.sendBtn')
        .should('be.visible');
    });

    it("open send page and back to account", () => {
        login();
        cy
        .visit("popup/popup.html",{onBeforeLoad})
        .get('.sendBtn')
        .click()
        .get('.address .ae-input')
        .should('be.visible')
        .get('.sendAmount')
        .should('be.visible')
        .get('.actions .toAccount')
        .should('be.visible')
        .click()
        .get('.ae-card.primary')
        .should('be.visible')
    });

    it("check enter public key",() => {
        login();
        cy
        .visit("popup/popup.html",{onBeforeLoad})
        .get('.sendBtn')
        .click()
        .get('.ae-input.aemount')
        .type('0.001')
        .get('.sendBtn')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('.ae-modal-light h1')
        .should('contain','Incorrect address')
        .get('.ae-modal-light button')
        .click()
        .get('.ae-modal-light')
        .should('not.be.visible')
    });

    it("check enter amount",() => {
        login();
        cy
        .visit("popup/popup.html",{onBeforeLoad})
        .get('.sendBtn')
        .click()
        .get('.address .ae-input')
        .type('asdasdsad.test')
        .get('.ae-input.aemount')
        .type('-1.2')
        .get('.sendBtn')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('.ae-modal-light h1')
        .should('contain','Enter amount')
        .get('.ae-modal-light button')
        .click()
        .get('.ae-input.aemount')
        .clear()
        .type('0')
        .get('.sendBtn')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('.ae-modal-light button')
        .click()
        .get('.ae-input.aemount')
        .clear()
        .type('0.00000')
        .get('.sendBtn')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('.ae-modal-light button')
        .click()
        .get('.ae-modal-light')
        .should('not.be.visible')
    });

    it("validate input before send", () => {
        login();
        cy
        .visit("popup/popup.html",{onBeforeLoad})
        .wait(5000)
        .get('.sendBtn')
        .click()
        .get('.sendBtn')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('.ae-modal-light h1')
        .should('contain','Incorrect address')
        .get('.ae-modal-light button')
        .click()
        .get('.address .ae-input')
        .type('asdasdsad')
        .get('.sendBtn')
        .click()
        .get('.ae-modal-light h1')
        .should('contain','Incorrect address')
        .get('.ae-modal-light button')
        .click()
        .wait(5000)
        .get('.ae-input.aemount')
        .type('0.00000001')
        .get('.sendBtn')
        .click()
        .get('.ae-modal-light')
        .get('.buttons > .primary')
        .click()
        .get('.ae-input.aemount')
        .clear()
        .type('2000')
        .get('.address .ae-input')
        .type('asdasdsad.test')
        .get('.sendBtn')
        .click()
        .get('.ae-modal-light h1')
        .should('contain','Insufficient balance')
    });

    it("can send tokens", () => {
        login();
        cy
        .visit("popup/popup.html",{onBeforeLoad})
        .wait(5000)
        .get('.sendBtn')
        .click()
        .get('.address .ae-input')
        .type(PUBLIC_KEY_SEND)
        .wait(5000)
        .get('.ae-input.aemount')
        .type('0.00000001')
        .get('.sendBtn')
        .click()
        .get('.spendTxDetailsList')
        .should('be.visible')
        .get('.confirm')
        .should('not.have.class','disabled')
        .get('.reject')
        .click()
        .get('.spendTxDetailsList')
        .should('not.be.visible')
    });

    it("enter wrong name show error", () => {
        login()
        cy
        .visit("popup/popup.html",{onBeforeLoad})
        .get('.ae-loader')
        .should('not.be.visible')
        .wait(5000)
        .get('.sendBtn')
        .should('be.visible')
        .click()
        .get('.address .ae-input')
        .type("asda.test")
        .get('.ae-input.aemount')
        .type('0.001')
        .get('.sendBtn')
        .click()
        .get('.spendTxDetailsList')
        .should('be.visible')
        .get('.confirm')
        .should('have.class','disabled')
        .get('.alert-card.primary')
        .should('be.visible')
        .get('.spendAccountAddr')
        .should('contain','Unknown')
    })

    it("enter wrong name show error", () => {
        login()
        cy
        .visit("popup/popup.html",{onBeforeLoad})
        .get('.ae-loader')
        .should('not.be.visible')
        .wait(5000)
        .get('.sendBtn')
        .should('be.visible')
        .click()
        .get('.address .ae-input')
        .type("asda.tet")
        .get('.sendBtn')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
    })

    it("send tokens and check have transaction item after send", () => {
        login();
        let txHash = '';
        cy
        .visit("popup/popup.html",{onBeforeLoad})
        .wait(5000)
        .get('.sendBtn')
        .click()
        .get('.address .ae-input')
        .type(PUBLIC_KEY_SEND)
        .get('.ae-input.aemount')
        .type('0.001')
        .get('.sendBtn')
        .click()
        .get('.spendTxDetailsList')
        .should('be.visible')
        .get('.confirm')
        .should('not.have.class','disabled')
        .wait(4000)
        .get('.confirm')
        .click()
        .get('.ae-loader')
        .should('be.visible')
        .get('.ae-loader')
        .should('not.be.visible')
    });

    
});