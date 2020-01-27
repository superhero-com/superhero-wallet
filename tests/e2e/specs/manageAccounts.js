import { onBeforeLoad } from '../support/mock_chrome.js';
import { login } from '../login';
import { generateWallet, mnemonic, PRIVATE_KEY_IMPORT,PRIVATE_KEY, ACCOUNT_PASSWORD,ACCOUNT_PASSWORD_STRONG, importPrivate ,importSeed,importKeystore} from '../utils.js';
import { getHdWalletAccount,generateHdWallet, createAccount,createSubAccount,renameAccounts,renameAccountFromManageAccounts } from '../utils';
import { generateMnemonic, mnemonicToSeed, validateMnemonic } from '@aeternity/bip39';



const hdWallet = (seed) => {
    let wallet = generateHdWallet(seed);
    let publicKey = getHdWalletAccount(wallet,0).address;
    return publicKey;
};

const deriveAdress = (seed,index) => {
    let wallet = generateHdWallet(seed);
    let publicKey = getHdWalletAccount(wallet,index).address;
    return publicKey;
};


describe('Test cases for managing accounts and deriving multiple address from same private key', () => {

    it("have account menu", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad})
        .get('#account')
        .should('be.visible')
        .get('#account .dropdown-button-name')
        .should('contain','Main account')
        .get('#account')
        .click()
        .get('.dropdown-holder')
        .should('be.visible')
        .get('.dropdown-holder li').eq(0)
        .should('be.visible')
        .should('have.class','activeAccount')
        .get('.dropdown-holder li').eq(0).find('.subAccountName')
        .should('contain','Main account')
        .get('.newSubaccount')
        .should('be.visible')
        .get('.iconBtn')
        .should('be.visible')
    });

    it("open manage accounts page", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad})
        .get('#account')
        .click()
        .get('.dropdown-holder li button').eq(0)
        .click()
        .get('#manageAccounts')
        .should('be.visible')
        .get('.editaccount')
        .should('be.visible')
        .get('.addaccount')
        .should('be.visible');
    });


    it("add new account and check if present in menu", () => {
        login();
        createAccount();
    });

    it("add new account and check if address is derived correctly", () => {
        login();
        createAccount();
        cy
        .get('#settings')
        .click()
        .get('.dropdown-holder > :nth-child(1) > .ae-button')
        .click()
        .get('.ae-card-header-avatar .ae-input-plain')
        .should('have.value','Test 123')
        .get('.ae-card.primary ul')
        .invoke('attr', 'title')
        .should('eq',deriveAdress(PRIVATE_KEY,1));
    });


    it("add new account check if pass validation rules", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad})
        .get('#account')
        .click()
        .get('.dropdown-holder li button').eq(0)
        .click()
        .get('.addaccount button')
        .click()
        .get('.add-form')
        .get('.add-form .ae-input')
        .get('.add-form button')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('.ae-modal-light .buttons button')
        .should('have.class','primary')
        .click()
        .get('.ae-modal-light')
        .should('not.be.visible')
        .get('.add-form .ae-input')
        .type("test")
        .get('.add-form button')
        .click()
        .get('.ae-modal-light .buttons button')
        .click()
        .get('#account .dropdown-button-name')
        .should('contain','test')
        .get('#account')
        .click()
        .get('.dropdown-holder li').eq(1).find('.subAccountName')
        .should('contain','test')
        .get('.dropdown-holder li').eq(0)
        .should('not.have.class','activeAccount')
        .get('.dropdown-holder li').eq(1)
        .should('have.class','activeAccount');
    });


    it("add new account and check if active", () => {
        login();
        createAccount();
        cy
        .get('.dropdown-holder li').eq(1).find('input[type="radio"]')
        .should('be.checked')
        .get('.dropdown-holder li').eq(0).find('input[type="radio"]')
        .should('not.be.checked');
    });


    it("check if selecting account makes it active", () => {
        login();
        createAccount();
        cy
        .get('.dropdown-holder')
        .should('be.visible')
        .get('.dropdown-holder li').eq(1).find('input[type="radio"]')
        .should('be.checked')
        .get('.dropdown-holder li').eq(0).find('input[type="radio"]')
        .should('not.be.checked')
        .get('#settings')
        .click()
        .get('.dropdown-holder > :nth-child(1) > .ae-button')
        .click()
        .get('.dropdown-holder')
        .should('not.be.visible')
        .get('#account')
        .click()
        .get('.dropdown-holder')
        .should('be.visible')
        .get('.dropdown-holder li').eq(0)
        .click()
        .get('.dropdown-holder').should('not.be.visible')
        .get('#account')
        .click()
        .get('.dropdown-holder li').eq(1)
        .click()
    });

    it("change active account change address and balance", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad:(contentWindow) => { onBeforeLoad(contentWindow,'subaccounts') }})
        .get('.mainLoader')
        .should('not.be.visible')
        .get('#account')
        .click()
        .get('.dropdown-holder li').eq(0)
        .click()
        .get('.dropdown-holder')
        .should('not.be.visible')
        .get('#account')
        .click()
        .get('.dropdown-holder li').eq(0).find('input[type="radio"]')
        .should('be.checked')
        .get('.dropdown-holder li').eq(0)
        .click()
        .get('.dropdown-holder')
        .should('not.be.visible')
        .get('.ae-card.primary ul')
        .invoke('attr', 'title')
        .should('eq',deriveAdress(PRIVATE_KEY,0))
        .get('#account')
        .click()
        .get('.dropdown-holder li').eq(1)
        .click()
        .get('.dropdown-holde')
        .should('not.be.visible')
        .get('.ae-card.primary ul')
        .invoke('attr', 'title')
        .should('eq',deriveAdress(PRIVATE_KEY,1))
    });

    it("change active account change transactions", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad:(contentWindow) => { onBeforeLoad(contentWindow,'subaccounts') }})
        .get('.transactionList')
        .should('be.visible')
        .get('.noTransactions')
        .should('not.be.visible')
        .get('#account')
        .click()
        .get('.dropdown-holder li').eq(2)
        .click()
        .get('.transactionList')
        .should('not.be.visible')
        .get('.noTransactions')
        .should('be.visible')
    });


    it("change active account change all transactions", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad:(contentWindow) => { onBeforeLoad(contentWindow,'subaccounts') }})
        .get('.transactionList')
        .should('be.visible')
        .get('.noTransactions')
        .should('not.be.visible')
        .get('.transactionHistory')
        .click()
        .get('.allTransactions')
        .children().should('not.have.length', 0)
        .get('#account')
        .click()
        .get('.dropdown-holder li').eq(2)
        .click()
        .get('.allTransactions')
        .children().should('have.length', 1)
    });


    it("change account name from account page ", () => {
        login();
        renameAccounts();
    });


    it("change account name from account page logout and login again", () => {
        login();
        renameAccounts();
        cy
        .get('#settings')
        .click()
        .get('.toLogout')
        .click()
        .get('input[type="password"]')
        .type(ACCOUNT_PASSWORD)
        .get('button')
        .contains('Login')
        .click()
        .get('.ae-loader')
        .should('be.visible')
        .get('#account')
        .click()
        .get('.dropdown-holder')
        .should('be.visible')
        .get('.dropdown-holder li').eq(0)
        .find('.subAccountName')
        .get('.dropdown-holder li').eq(1)
        .find('.subAccountName')
        .should('contain','Account 2')
    });

    it("change account name from manage accounts page logout and login again", () => {
        login();
        renameAccountFromManageAccounts();
        cy
        .get('#settings')
        .click()
        .get('.toLogout')
        .click()
        .get('input[type="password"]')
        .type(ACCOUNT_PASSWORD)
        .get('button')
        .contains('Login')
        .click()
        .get('.ae-loader')
        .should('be.visible')
        .get('#account')
        .click()
        .get('.dropdown-holder li').eq(0)
        .find('.subAccountName')
        .should('contain','Account 1')
        .get('.dropdown-holder li').eq(1)
        .find('.subAccountName')
        .should('contain','Account 2')
    });


    it("change account name from manage accounts validate data before save", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad:(contentWindow) => { onBeforeLoad(contentWindow,'subaccounts') }})
        .get('#account')
        .click()
        .get('.dropdown-holder li.manageAccounts button').eq(0)
        .click()
        .get('.editaccount').eq(0)
        .find('button')
        .click()
        .get('.editaccount').eq(0)
        .find('.ae-input-plain')
        .clear()
        .get('.editaccount').eq(0)
        .find('.ae-icon-check')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('.ae-modal-light .buttons button')
        .should('have.class','primary')
        .click()
        .get('.ae-modal-light')
        .should('not.be.visible')
        .get('.editaccount').eq(0)
        .find('.ae-icon-close')
        .click()
        .get('.editaccount').eq(0)
        .find('.ae-input-plain')
        .should('not.be.visible')
        .get('#account .dropdown-button-name')
        .should('contain','Main account');
    });

    it("check login page", () => {
        cy.
        visit('popup/popup.html',{onBeforeLoad});
    });

});