import {onBeforeLoad} from './support/mock_chrome.js';
import { derivePathFromKey, getKeyPair } from '@aeternity/hd-wallet/src/hd-key';
import { Crypto } from '@aeternity/aepp-sdk/es';
import { generateHDWallet } from '@aeternity/hd-wallet/src';
import { generateMnemonic, mnemonicToSeed, validateMnemonic } from '@aeternity/bip39';

export const prepare = async () => {
    delete localStorage.vuex;

};
export const account = {
  publicKey:"ak_d45oN2qzS1vqdiWVYCfDeWLVb3EepWxAJrsDbCSmnYiZguerw",
  secretKey:"ef07a269ce62e81dbd507d2d677e06654765984aa4650bcf2ed68bbfc783f8e4301ba902bf2b2c176ac934eb41181866ae25f19dcbdd42c4aa448c0f82c913f9",
  encryptedPrivateKey:{"name":"keystore","version":1,"public_key":"ak_d45oN2qzS1vqdiWVYCfDeWLVb3EepWxAJrsDbCSmnYiZguerw","id":"298c2d6e-79fd-4df6-aea9-4258fde7a1d3","crypto":{"secret_type":"ed25519","symmetric_alg":"xsalsa20-poly1305","ciphertext":"74d4706bba362e7cda0effd66ff1da27e5766d6d7d4e630be9763179270d708154d24d1c0fd5f2075d154e1bd2c49699ccfb09b6af2bbf1c51c782a9b555584a447c9dd3082fe6abaffcd31ed4c4f2d7","cipher_params":{"nonce":"de66538f7981040a79876ed85e73e9ae16946887a9baab07"},"kdf":"argon2id","kdf_params":{"memlimit_kib":65536,"opslimit":3,"parallelism":1,"salt":"67eae2f3ff0becc34ca3b2bf9cec414c"}}}
}
export const allowances = {
  sender: "ak_d45oN2qzS1vqdiWVYCfDeWLVb3EepWxAJrsDbCSmnYiZguerw",
  reciever: "ak_26jiGAScn8BMaxrwUbK2XY1b5xLPM52kYwiVnjirY9jtsFtojx"
}
export const tabs = [
  {url:"www.google.com", favIconUrl: "https://www.google.com/favicon.ico"},
  {url:"aeternity.com", favIconUrl: undefined }
];
export const transaction = {
  abc: {
    id:"abc",
    tx: {
      recipientId:"ak_FxYhMbVDTquNu38PHWoMCoiw7CNq2sSQFbhK9zgyi1U1wH6Mv",
      amount:0.000001
    },
    type:'txSign'
  }
  
};
export const transaction2 = {
  abc: {
    id:"abc",
    tx: {
      recipientId:"ak_FxYhMbVDTquNu38PHWoMCoiw7CNq2sSQFbhK9zgyi1U1wH6Mv",
      amount:200
    },
    type:'txSign'
  }
};
export const connectObj = {
  type:"connectConfirm",
  params: {
    hostname:"testnet.aeternal.io",
    protocol:"https:",
    title:"aeternity explorer"
  }
}
export const network = {
  Testnet: {
    url: 'https://sdk-testnet.aepps.com',
    internalUrl: 'https://sdk-testnet.aepps.com',
    networkId: 'ae_uat',
    middlewareUrl: 'https://testnet.aeternal.io/',
    explorerUrl:'https://testnet.aeternal.io'
  },
  Mainnet: {
    url: 'https://sdk-mainnet.aepps.com',
    internalUrl: 'https://sdk-mainnet.aepps.com',
    networkId: 'ae_mainnet',
    middlewareUrl: 'https://mainnet.aeternal.io/',
    explorerUrl:'https://mainnet.aeternal.io'
  }
};
export const current = {
  network: 'Testnet',
  language: 'en'
};
export const ACCOUNT_PASSWORD = "qwerty";
export const ACCOUNT_PASSWORD_STRONG = "qwerty#@!123ABCD";
export const ACCOUNT_PASSWORD2 = 'Parola.123';
export const PRIVATE_KEY = "ef07a269ce62e81dbd507d2d677e06654765984aa4650bcf2ed68bbfc783f8e4301ba902bf2b2c176ac934eb41181866ae25f19dcbdd42c4aa448c0f82c913f9";
export const PRIVATE_KEY_IMPORT = "82e8a6103b5fd09b82d71e0ef18686b66f798428312ef84adfb51f1c7ca794a0e4197f13b860b0f18b960d83e230e50752dc9f77ec2ea568300dcf728c1a8acd";
export const PUBLIC_KEY_SEND = "ak_2uhfvqH1NhiTcZ6F8QmDRvZQdoYGN3agdZi9AZyY4pP3A9zdFZ";
export const mnemonic = 'shop sound chef return calm outdoor easily picnic circle wine walnut belt';

export const prepareEncryptedPrivateKey = (customState = {}) => {
    
    const state = Cypress._.merge({
        subaccounts: [],
        account: {},
        activeAccount:0,
        wallet:[],
        account: account,
        balance: 0,
        current: current,
        network: network,
        popup:{
          show:false,
          type:'',
          title:'',
          msg:'',
          secondBtn:false,
          secondBtnClick:'',
          data:''
        },
        isLoggedIn:false
    }, customState);
    window.localStorage.vuex = JSON.stringify(state);
    window.localStorage.isLogged = false;
    window.localStorage.test = "test";
    window.localStorage.userAccount = {
        userAccount:account
    };

    return state;
}
export const getLatestThreeTransactions = (publicKey) => {
  return fetch(network[current.network].middlewareUrl + "/middleware/transactions/account/" + publicKey + "?limit=3")
  .then(res => res.json() )
};

export const generateWallet = () => {
  let seeds = mnemonic.split(" ");
  cy
  .visit('popup/popup.html',{onBeforeLoad:(contentWindow) => { onBeforeLoad(contentWindow,'seed') }})
  .wait(2000)
  .get('footer button.primary').click()
  .get('input[type="password"]').eq(0).clear().type(ACCOUNT_PASSWORD_STRONG)
  .get('input[type="password"]').eq(1).clear().type(ACCOUNT_PASSWORD_STRONG)
  .get('button').contains('Continue').click()
  .visit('popup/popup.html',{onBeforeLoad:(contentWindow) => { onBeforeLoad(contentWindow,'seed') }})
  .get('button.nextStep').click()
  .get('.seeds-container').should('be.visible')
  .wait(10000)
  .get('button.nextStep').click()
  .wrap(seeds).each((num,i) => {
      cy.get('.ae-phraser-container').eq(0).within(() => {
          cy.get('.ae-badge.seedBadge').contains(num).not('.selected').click();
      });
  })
  .get('button.nextStep').click()
  .get('.ae-loader')
  .should('be.visible')
  .get('.ae-card')
  .should('be.visible');
};


export const importPrivate = () => {
  cy.
  visit('popup/popup.html',{onBeforeLoad})
  .get('button.importBtn').click()
  .get('.ae-modal input').type(PRIVATE_KEY_IMPORT)
  .get('.ae-modal button').contains('Continue').click()
  .get('input[type="password"]').eq(0).clear().type(ACCOUNT_PASSWORD_STRONG)
  .get('input[type="password"]').eq(1).clear().type(ACCOUNT_PASSWORD_STRONG)
  .get('button').contains('Import').click()
  .get('.ae-loader')
  .should('be.visible')
  .get('.ae-card.primary ul')
  .invoke('attr', 'title')
  .should('eq',hdWallet(PRIVATE_KEY_IMPORT));
};

export const importSeed  = () => {
  cy
  .visit('popup/popup.html',{onBeforeLoad})
  .get('button.importBtn').click()
  .get('.tabs span').eq(2).click()
  .get('textarea').clear().type(mnemonic)
  .get('button').contains('Continue').click()
  .get('input[type="password"]').eq(0).clear().type(ACCOUNT_PASSWORD_STRONG)
  .get('input[type="password"]').eq(1).clear().type(ACCOUNT_PASSWORD_STRONG)
  .get('button').contains('Restore').click()
  .get('.ae-loader')
  .should('be.visible')
  .get('.ae-card.primary ul')
  .invoke('attr', 'title')
  .should('eq',hdWallet(mnemonicToSeed(mnemonic)));
}
 
export const importKeystore = () => {
  cy
  .visit('popup/popup.html',{onBeforeLoad})
  .get('button.importBtn').click()
  .get('.tabs span').eq(1).click()
  .uploadFile('input[type="file"]','../../keystore4.json','application/json')
  .get('button').contains('Continue').click()
  .get('input[type="password"]').clear().type(ACCOUNT_PASSWORD_STRONG)
  .get('button').contains('Import').click()
  .get('.ae-loader')
  .should('be.visible')
  .get('.ae-card.primary ul')
  .invoke('attr', 'title')
  .should('eq',hdWallet(PRIVATE_KEY_IMPORT));
}

export const generateHdWallet = (seed) => {
    
    if(typeof seed == 'string' ) {
        seed = Buffer.from(seed,'hex');
    }

    return generateHDWallet(seed);
}

export const getHdWalletAccount = (wallet, accountIdx = 0) => {
    
    if(wallet.chainCode.constructor !== Uint8Array) {
        wallet = JSON.parse(JSON.stringify(wallet));
        wallet = {
            chainCode:new Uint8Array(new Uint8Array(Object.values(wallet.chainCode))),
            privateKey:new Uint8Array(new Uint8Array(Object.values(wallet.privateKey)))
        }
    }
    
    const keyPair = getKeyPair(derivePathFromKey(`${accountIdx}h/0h/0h`, wallet).privateKey);
    
    return {
        ...keyPair,
        idx:accountIdx,
        address: Crypto.aeEncodeKey(keyPair.publicKey)
    };
}

export const hdWallet = (seed) => {
  let wallet = generateHdWallet(seed);
  let publicKey = getHdWalletAccount(wallet,0).address;
  return publicKey;
};

export const createAccount = () => {
  cy
  .visit('popup/popup.html',{onBeforeLoad})
  .get('#account')
  .click()
  .get('.dropdown-holder li button').eq(0)
  .click()
  .get('.addaccount button')
  .click()
  .get('.add-form')
  .should('be.visible')
  .get('.add-form .ae-input')
  .type("Test 123")
  .get('.add-form button')
  .click()
  .get('.ae-modal-light')
  .should('be.visible')
  .get('.ae-modal-light .buttons button')
  .click()
  .get('.ae-modal-light')
  .should('not.be.visible')
  .get('#account .dropdown-button-name')
  .should('contain','Test 123')
  .get('#account')
  .click()
  .get('.dropdown-holder')
  .should('be.visible')
  .get('.dropdown-holder li').eq(1).find('.subAccountName')
  .should('contain','Test 123')
  .get('.dropdown-holder li').eq(0)
  .should('not.have.class','activeAccount')
  .get('.dropdown-holder li').eq(1)
  .should('have.class','activeAccount');
};
export const createSubAccount = () => {
  cy
  .visit('popup/popup.html',{onBeforeLoad})
  .get('#account')
  .click()
  .get('.dropdown-holder li button').eq(0)
  .click()
  .get('.addaccount button')
  .click()
  .get('.add-form')
  .should('be.visible')
  .get('.add-form .ae-input')
  .type("Test 123")
  .get('.add-form button')
  .click()
  .get('.ae-modal-light')
  .should('be.visible')
  .get('.ae-modal-light .buttons button')
  .click()
  .get('.ae-modal-light')
  .should('not.be.visible')
  .get('#account .dropdown-button-name')
  .should('contain','Test 123')
  .get('#settings')
  .click()
  .get('.dropdown-holder > :nth-child(1) > .ae-button')
  .click();
};

export const renameAccounts = () => {
  cy
  .visit('popup/popup.html',{onBeforeLoad:(contentWindow) => { onBeforeLoad(contentWindow,'subaccounts') }})
  .get('.ae-loader')
  .should('not.be.visible')
  .get('.ae-card-header-avatar .ae-input-plain')
  .clear()
  .type("Account 1")
  .get('#account .dropdown-button-name')
  .should('contain','Account 1')
  .get('#account')
  .click()
  .get('.dropdown-holder li').eq(0)
  .find('.subAccountName')
  .should('contain','Account 1')
  .get('.dropdown-holder li').eq(1)
  .click()
  .get('.dropdown-holder')
  .should('not.be.visible')
  .get('.ae-card-header-avatar .ae-input-plain')
  .clear()
  .type("Account 2")
  .get('#account .dropdown-button-name')
  .should('contain','Account 2')
  .get('#account')
  .click()
  .get('.dropdown-holder li').eq(1)
  .find('.subAccountName')
  .should('contain','Account 2');
};

export const renameAccountFromManageAccounts = () => {
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
  .type('Account 1')
  .get('.editaccount').eq(0)
  .find('.ae-icon-check')
  .click()
  .get('.editaccount').eq(1)
  .find('button')
  .click()
  .get('.editaccount').eq(1)
  .find('.ae-input-plain')
  .clear()
  .type('Account 2')
  .get('.editaccount').eq(1)
  .find('.ae-icon-check')
  .click()
  .get('#account .dropdown-button-name')
  .should('contain','Account 1')
  .get('#account')
  .click()
  .get('.dropdown-holder li').eq(0)
  .find('.subAccountName')
  .should('contain','Account 1')
  .get('.dropdown-holder li').eq(1)
  .find('.subAccountName')
  .should('contain','Account 2')
};


export const createNetwork = () => {
  cy
  .visit('popup/popup.html',{onBeforeLoad})
  .get('#network')
  .click()
  .get('.manageAccounts')
  .click()
  .get('.dropdown-holder')
  .should('not.be.visible')
  .get('h3')
  .should('contain','Manage networks')
  .should('be.visible')
  .get('h4 > button > .ae-icon')
  .click()
  .get('.add-form')
  .should('be.visible')
  .get('.ae-button').should('contain','Add')
  .click()
  .get('.ae-modal-light')
  .get('h1').should('contain','Required fields!')
  .get('.buttons > .ae-button').should('contain','Ok')
  .click()
  .get('.node-name .ae-input')
  .type('123')
  .get('.ae-button').should('contain','Add')
  .click()
  .get('.ae-modal-light')
  .get('h1').should('contain','Required fields!')
  .get('.buttons > .ae-button').should('contain','Ok')
  .click()
  .get('.node-name .ae-input')
  .clear()
  .get('.node-url .ae-input')
  .type('123')
  .get('.ae-button').should('contain','Add')
  .click()
  .get('.ae-modal-light')
  .get('h1').should('contain','Required fields!')
  .get('.buttons > .ae-button').should('contain','Ok')
  .click()
  .get('.node-url .ae-input')
  .clear()
  .get('.node-name .ae-input')
  .type('google')
  .get('.node-url .ae-input')
  .type('www.google.com')
  .get('.ae-button').should('contain','Add')
  .click()
  .get('.ae-modal-light')
  .get('h1').should('contain','Successfully added!')
  .get('.buttons > .ae-button').should('contain','Ok')
  .click()
  .get('#network')
  .click()
  .get('.dropdown-holder')
  .should('be.visible')
  .get('#network > .ae-list > :nth-child(3)')
  .get(':nth-child(3) > .subAccountInfo > .subAccountName')
  .should('contain','google')
  .get(':nth-child(3) > .subAccountInfo > .subAccountBalance')
  .should('contain','www.google.com')
}