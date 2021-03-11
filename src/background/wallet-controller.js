import { generateHdWallet, getHdWalletAccount } from '../popup/utils/hdWallet';
import { parseFromStorage } from '../popup/utils/helper';

class WalletController {
  generateWallet({ seed }) {
    this.wallet = generateHdWallet(parseFromStorage(seed));
    const { address } = getHdWalletAccount(this.wallet);
    return { generate: true, address };
  }
}

export default new WalletController();
