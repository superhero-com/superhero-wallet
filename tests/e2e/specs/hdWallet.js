import { onBeforeLoad } from '../support/mock_chrome.js';
import { login } from '../login';
import { generateWallet, mnemonic, PRIVATE_KEY_IMPORT, ACCOUNT_PASSWORD, importPrivate ,importSeed,importKeystore, hdWallet} from '../utils.js';
import { getHdWalletAccount,generateHdWallet } from '../utils';
import { generateMnemonic, mnemonicToSeed, validateMnemonic } from '@aeternity/bip39';




describe('Test cases for Generating wallets and deriving public kyes', () => {

    it("account creation generate correct private and public key from seed", () => {
        generateWallet();
        cy
        .get('.ae-card.primary ul')
        .invoke('attr', 'title')
        .should('eq',hdWallet(mnemonicToSeed(mnemonic)));
    });

    it("import private key derive correct public key", () => { 
        importPrivate();
    });

    it("import seed phrase derive corect private and public key", () => {
        importSeed();
    });

    it("import keystore.json decrypt correctly and show correct public key", () => {
        importKeystore();
    });

    it("check login page", () => {
        cy.
        visit('popup/popup.html',{onBeforeLoad});
    });
});