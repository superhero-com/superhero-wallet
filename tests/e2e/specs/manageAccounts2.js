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

const accountName = "Main account"

describe('Test cases for managing accounts and deriving multiple address from same private key part 2', () => {
    it("add account logout and login and check if present in menu", () => {
        login();
        createAccount();
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
        .get('.dropdown-holder')
        .should('not.be.visible')
        .get('#account')
        .click()
        .get('.dropdown-holder li').eq(0)
        .find('.subAccountName')
        .should('contain',accountName)
        .get('.dropdown-holder li').eq(1)
        .find('.subAccountName')
        .should('contain','Test 123')
    });

    it("account creation generate correct private and public key from seed", () => {
        generateWallet();
        cy
        .get('.ae-card.primary ul')
        .invoke('attr', 'title')
        .should('eq',hdWallet(mnemonicToSeed(mnemonic)))
        .get('#account')
        .click()
        .get('.dropdown-holder li').eq(0)
        .find('.subAccountName')
        .should('contain','Main account')
        .get('#account .dropdown-button-name')
        .should('contain','Main account');
    });


    it("import private key and check if account present in menu", () => {
        importPrivate();
        cy
        .get('#account')
        .click()
        .get('.dropdown-holder li').eq(0)
        .find('.subAccountName')
        .should('contain','Main account')
        .get('#account .dropdown-button-name')
        .should('contain','Main account');
    });

    it("import keystore and check if account present in menu", () => {
        importKeystore();
        cy
        .get('#account')
        .click()
        .get('.dropdown-holder li').eq(0)
        .find('.subAccountName')
        .should('contain','Main account')
        .get('#account .dropdown-button-name')
        .should('contain','Main account');
    });

    it("import seed and check if account present in menu", () => {
        importSeed();
        cy
        .get('#account')
        .click()
        .get('.dropdown-holder li').eq(0)
        .find('.subAccountName')
        .should('contain','Main account')
        .get('#account .dropdown-button-name')
        .should('contain','Main account');
    });

    it("login and check if account present in menu", () => {
        login();
        cy
        .get('#account')
        .click()
        .get('.dropdown-holder li').eq(0)
        .find('.subAccountName')
        .should('contain', accountName)
        .get('#account .dropdown-button-name')
        .should('contain', accountName);
    });

    it("login with subaccounts and check if they are present in menu", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad:(contentWindow) => { onBeforeLoad(contentWindow,'subaccounts') }})
        .get('#account')
        .click()
        .get('.dropdown-holder li').eq(0)
        .find('.subAccountName')
        .should('contain', accountName)
        .get('.dropdown-holder li').eq(1)
        .find('.subAccountName')
        .should('contain','Sub account 2')
        .get('.dropdown-holder li').eq(2)
        .find('.subAccountName')
        .should('contain','Sub account 3')
        .get('#account .dropdown-button-name')
        .should('contain', accountName);
    });

    it("derive correctly three address ", () => {
        login();
        createSubAccount();
        cy
        .get('.ae-card-header-avatar .ae-input-plain')
        .should('have.value','Test 123')
        .get('.ae-card.primary ul')
        .invoke('attr', 'title')
        .should('eq',deriveAdress(PRIVATE_KEY,1));
        createSubAccount();
        cy
        .get('.ae-card-header-avatar .ae-input-plain')
        .should('have.value','Test 123')
        .get('.ae-card.primary ul')
        .invoke('attr', 'title')
        .should('eq',deriveAdress(PRIVATE_KEY,2));
        createSubAccount();
        cy
        .get('.ae-card-header-avatar .ae-input-plain')
        .should('have.value','Test 123')
        .get('.ae-card.primary ul')
        .invoke('attr', 'title')
        .should('eq',deriveAdress(PRIVATE_KEY,3));
    });

    it("check login page", () => {
        cy.
        visit('popup/popup.html',{onBeforeLoad});
    });
});