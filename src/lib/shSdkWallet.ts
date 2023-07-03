import {
  AensName,
  AeSdkWallet,
  sendTransaction,
  spend,
} from '@aeternity/aepp-sdk-13';

import { Encoded } from '@aeternity/aepp-sdk-13/src/utils/encoder';
import { Store } from 'vuex';
import { useAccounts } from '../composables/accounts';
import { AccountSuperhero } from './accounts/superhero';

/**
 * Custom fields in options, `modal` and `payload` for spend function.
 * `modal` is true when user consent popup modal is required
 * `payload` support payload along with the transaction
 */
type ISpendOptions = Omit<Parameters<typeof spend>[2], 'onAccount' | 'onNode'>
  & {
    modal?: boolean,
    payload?: Encoded.Any,
  }

export class ShSdkWallet extends AeSdkWallet {
  store: Store<any>;

  constructor(store: Store<any>, opt: any) {
    super(opt);
    this.store = store;
  }

  _resolveAccount() {
    return new AccountSuperhero(this.store);
  }

  getAccounts() {
    const { activeAccount } = useAccounts({ store: this.store });
    return ({
      current: { [activeAccount.value.address]: {} },
      connected: {
      },
    });
  }

  addresses() {
    const { accountsAddressList } = useAccounts({ store: this.store });
    return accountsAddressList.value as Encoded.AccountAddress[];
  }

  spendWithCustomOptions(
    amount: string | number,
    recipientId: Encoded.AccountAddress | AensName,
    options: ISpendOptions,
  ): ReturnType<typeof sendTransaction> {
    return super.spend(amount, recipientId, options as any); // TODO: remove type casting once https://github.com/aeternity/aepp-sdk-js/issues/1791 is resolved
  }

  /**
   * Get Wallet info object
   * @returns Object with wallet information
   */
  async getWalletInfo(): Promise<any> {
    // async getWalletInfo(): Promise<WalletInfo> {
    return {
      id: this.id,
      name: this.name,
      networkId: await this.api.getNetworkId(),
      origin: undefined as any,
      type: this._type as any,
    } as any;
  }
}
