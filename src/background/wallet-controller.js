import { generateHdWallet, getHdWalletAccount } from '../popup/utils/hdWallet';
import { parseFromStorage } from '../popup/utils/helper';

class WalletController {
  generateWallet({ seed }) {
    this.wallet = generateHdWallet(parseFromStorage(seed));
    const { address } = getHdWalletAccount(this.wallet);
    return { generate: true, address };
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

export default new WalletController();
