import { onBeforeLoad } from '../support/mock_chrome.js';
import { login } from '../login';
import { generateWallet, mnemonic, PRIVATE_KEY_IMPORT,PRIVATE_KEY, ACCOUNT_PASSWORD,ACCOUNT_PASSWORD_STRONG, importPrivate ,importSeed,importKeystore, createNetwork} from '../utils.js';
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


describe('Test cases for managing networks', () => {

    it("have networks menu", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad})
        .get('#network')
        .should('be.visible')
        .get('#network .dropdown-button-name')
        .should('contain','Testnet')
        .get('#network')
        .click()
        .get('.dropdown-holder')
        .should('be.visible')
        .get('.dropdown-holder li').eq(0)
        .should('be.visible')
        .should('have.class','activeAccount')
        .get('.dropdown-holder li').eq(1)
        .should('be.visible')
        .should('not.have.class','activeAccount')
        .get('.dropdown-holder li').eq(1)
        .get('.subAccountName')
        .should('contain','Mainnet')
        .should('be.visible')
        .get('.manageAccounts')
        .should('be.visible')
        .get('.iconBtn')
        .should('be.visible')
    });

    it("open manage networks page and back to Account", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad})
        .get('#account')
        .click()
        .get('.dropdown-holder')
        .should('be.visible')
        .get('.manageAccounts').eq(0)
        .should('be.visible')
        .click()
        .get('.dropdown-holder')
        .should('not.be.visible')
        .get('.addaccount')
        .should('be.visible')
        .get('.backbutton')
        .click()
    });


    it("validate network add inputs and then add new network and check if present in menu", () => {
        login();
        createNetwork();
    });

    it("make active new added network", () => {
        login();
        createNetwork();
        cy
        .get('.ae-list > :nth-child(3)')
        .click()
        .get('#settings')
        .click()
        .get('.dropdown-holder > :nth-child(1) > .ae-button')
        .click()
        .get('#network > button > .dropdown-button-name')
        .should('contain', 'google')
    });

    it("hide add-form and remove of network", () => {
        login();
        createNetwork();
        cy
        .get('#network')
        .click()
        .get('.addaccount  > button > .ae-icon')
        .click()
        .get('.editaccount > div > button > .ae-icon')
        .click()
        .get('.addaccount  > button > .ae-icon')
        .should('be.visible')
        .get('.alternative')
        .click()
        .get('#network')
        .click()
        .get('.dropdown-holder')
        .find('li')
        .should('have.length', 3)
    });


});