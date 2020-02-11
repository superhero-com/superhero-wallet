import { setInterval } from 'timers';
import { generateHdWallet, getHdWalletAccount } from './popup/utils/hdWallet';
import { stringifyForStorage, parseFromStorage } from './popup/utils/helper';
import { addressGenerator } from './popup/utils/address-generator';

export default class WalletController {
  constructor(tests = false) {
    this.tests = tests;
    if (tests && localStorage.getItem('wallet')) {
      this.wallet = parseFromStorage(localStorage.getItem('wallet'));
    }
    if (!tests && process.env.IS_EXTENSION) {
      setInterval(() => {
        browser.windows.getAll({}).then(wins => {
          if (wins.length === 0) {
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
  }

  async unlockWallet({ accountPassword, encryptedPrivateKey }) {
    const match = await addressGenerator.decryptKeystore(encryptedPrivateKey, accountPassword);
    if (match !== false) {
      this.wallet = generateHdWallet(match);
      if (this.tests) {
        localStorage.setItem('wallet', stringifyForStorage(this.wallet));
      }
      const { address } = getHdWalletAccount(this.wallet);
      return { decrypt: true, address };
    }
    return { decrypt: false };
  }

  lockWallet() {
    this.wallet = null;
    browser.storage.local.remove('isLogged');
  }

  generateWallet({ seed }) {
    this.wallet = generateHdWallet(parseFromStorage(seed));
    if (this.tests) {
      localStorage.setItem('wallet', stringifyForStorage(this.wallet));
    }
    const { address } = getHdWalletAccount(this.wallet);
    return { generate: true, address };
  }

  getKeypair({ activeAccount, account }) {
    try {
      return stringifyForStorage({
        publicKey: account.publicKey,
        secretKey: getHdWalletAccount(this.wallet, activeAccount).secretKey,
      });
    } catch (e) {
      return { error: true };
    }
  }

  getAccount({ idx }) {
    return {
      address: getHdWalletAccount(this.wallet, idx).address,
    };
  }

  isLoggedIn() {
    return typeof this.wallet !== 'undefined' && this.wallet != null;
  }
}
