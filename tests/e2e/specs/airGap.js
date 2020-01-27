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


describe('Test cases for creating airgap account', () => {

    it("open Create AirGap Vault Account page all steps", () => {
        login();
        cy
        .visit('popup/popup.html',{onBeforeLoad})
        .get('#account')
        .click()
        .get('.airGapVault')
        .click()
        .get('.dropdown-holder')
        .should('not.be.visible')
        .get('.airgap-setup-definitions')
        .should('be.visible')
        .get('.qr-wrapper')
        .should('be.visible')
        .get('.ae-button')
        .should('have.class','step-button')
        .should('be.visible')
        .should('contain','Next')
        .click()
        .wait(500)
        .get('div.step2')
        .should('be.visible')
        .get('.ae-button')
        .click()
        .wait(3000)
        .get('video.camera')
        .should('be.visible')
    });

});