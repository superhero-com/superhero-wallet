import {onBeforeLoad} from './support/mock_chrome.js';
import { prepare,prepareEncryptedPrivateKey,ACCOUNT_PASSWORD, ACCOUNT_PASSWORD2 } from './utils';


export const login = (customState, account = 'account') => {
    prepare();
    const state = prepareEncryptedPrivateKey(customState);
    const pass = account == 'account' ? ACCOUNT_PASSWORD : ACCOUNT_PASSWORD2
    cy
      .visit('/popup/popup.html',{onBeforeLoad:(contentWindow) => { onBeforeLoad(contentWindow,account) }})
      .wait(4000)
      .get('input[type=password]').type(pass)
      .get('button')
      .contains('Login')
      .click()
      
      .wait(2000)
      .get('.ae-card')
      .should('be.visible')
      .get('.ae-header')
      .should('have.class','logged')
      .get('.mainLoader')
      .should('not.be.visible')
    return state;
};

export const loginAndLogout = () => {
    login();
    cy
    .visit("popup/popup.html",{onBeforeLoad})
    .get('#settings')
    .click()
    .get('.dropdown-holder')
    .should('be.visible')
    .get('.dropdown-holder .toLogout')
    .click()
    .get('input[type="password"]')
    .should('be.visible')
    .get('button')
    .contains('Login')
    .should('be.visible')
    .get('input[type="password"]')
    .type("1234")
    .get('button')
    .contains('Login')
    .click()
    .get('.ae-toolbar')
    .should('be.visible')
    .get('input[type="password"]')
    .clear()
    .type(ACCOUNT_PASSWORD);
}