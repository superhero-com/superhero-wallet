import { setInterval } from 'timers';
import stampit from '@stamp/it';
import { generateHdWallet, getHdWalletAccount } from './popup/utils/hdWallet';
import { stringifyForStorage, parseFromStorage } from './popup/utils/helper';
import { addressGenerator } from './popup/utils/address-generator';

export default stampit({
  init(tests = false) {
    this.tests = tests;
    if (tests && localStorage.getItem('wallet')) {
      this.wallet = parseFromStorage(localStorage.getItem('wallet'));
    }
    if (!tests && process.env.IS_EXTENSION) {
      setInterval(() => {
        browser.windows.getAll({}).then(wins => {
          if (wins.length == 0) {
            this.lockWallet();
            sessionStorage.removeItem('phishing_urls');
            browser.storage.local.remove('activeAccount');
          }
        });
        if (!this.wallet) {
          this.lockWallet();
        }
      }, 5000);
    }
  },
  methods: {
    unlockWallet({ accountPassword, encryptedPrivateKey }) {
      return new Promise(async (resolve, reject) => {
        const match = await addressGenerator.decryptKeystore(encryptedPrivateKey, accountPassword);
        if (match != false) {
          this.wallet = generateHdWallet(match);
          if (this.tests) {
            localStorage.setItem('wallet', stringifyForStorage(this.wallet));
          }
          const { address } = getHdWalletAccount(this.wallet);
          resolve({ decrypt: true, address });
        } else {
          resolve({ decrypt: false });
        }
      });
    },

    lockWallet() {
      this.wallet = null;
      browser.storage.local.remove('isLogged');
    },

    generateWallet({ seed }) {
      return new Promise((resolve, reject) => {
        this.wallet = generateHdWallet(parseFromStorage(seed));
        if (this.tests) {
          localStorage.setItem('wallet', stringifyForStorage(this.wallet));
        }
        const { address } = getHdWalletAccount(this.wallet);
        resolve({ generate: true, address });
      });
    },

    getKeypair({ activeAccount, account }) {
      return new Promise((resolve, reject) => {
        try {
          resolve(
            stringifyForStorage({
              publicKey: account.publicKey,
              secretKey: getHdWalletAccount(this.wallet, activeAccount).secretKey,
            })
          );
        } catch (e) {
          resolve({ error: true });
        }
      });
    },

    getAccount({ idx }) {
      return new Promise((resolve, reject) => {
        resolve({
          address: getHdWalletAccount(this.wallet, idx).address,
        });
      });
    },

    isLoggedIn() {
      return typeof this.wallet !== 'undefined' && this.wallet != null;
    },
  },
});

// export default class WalletController {
//   constructor(tests = false) {
//     this.tests = tests;
//     if (tests && localStorage.getItem('wallet')) {
//       this.wallet = parseFromStorage(localStorage.getItem('wallet'));
//     }
//     if (!tests && process.env.IS_EXTENSION) {
//       setInterval(() => {
//         browser.windows.getAll({}).then(wins => {
//           if (wins.length == 0) {
//             this.lockWallet();
//             sessionStorage.removeItem("phishing_urls")
//             browser.storage.local.remove('activeAccount')
//           }
//         });
//         if (!this.wallet) {
//           this.lockWallet();
//         }
//       }, 5000);
//     }
//   }

//   unlockWallet({ accountPassword, encryptedPrivateKey }) {
//     return new Promise(async (resolve, reject) => {
//       const match = await addressGenerator.decryptKeystore(encryptedPrivateKey, accountPassword);
//       if (match != false) {
//         this.wallet = generateHdWallet(match);
//         if (this.tests) {
//           localStorage.setItem('wallet', stringifyForStorage(this.wallet));
//         }
//         const { address } = getHdWalletAccount(this.wallet);
//         resolve({ decrypt: true, address });
//       } else {
//         resolve({ decrypt: false });
//       }
//     });
//   }

//   lockWallet() {
//     this.wallet = null;
//     browser.storage.local.remove('isLogged');
//   }

//   generateWallet({ seed }) {
//     return new Promise((resolve, reject) => {
//       this.wallet = generateHdWallet(parseFromStorage(seed));
//       if (this.tests) {
//         localStorage.setItem('wallet', stringifyForStorage(this.wallet));
//       }
//       const { address } = getHdWalletAccount(this.wallet);
//       resolve({ generate: true, address });
//     });
//   }

//   getKeypair({ activeAccount, account }) {
//     return new Promise((resolve, reject) => {
//       try {
//         resolve(
//           stringifyForStorage({
//             publicKey: account.publicKey,
//             secretKey: getHdWalletAccount(this.wallet, activeAccount).secretKey,
//           })
//         );
//       } catch (e) {
//         resolve({ error: true });
//       }
//     });
//   }

//   getAccount({ idx }) {
//     return new Promise((resolve, reject) => {
//       resolve({
//         address: getHdWalletAccount(this.wallet, idx).address,
//       });
//     });
//   }

//   isLoggedIn() {
//     return typeof this.wallet !== 'undefined' && this.wallet != null;
//   }
// }
