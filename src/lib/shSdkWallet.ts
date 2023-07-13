import {
  AensName,
  AeSdkWallet,
  sendTransaction,
  spend,
  Encoded,
} from '@aeternity/aepp-sdk-13';
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

  constructor(store: Store<any>, options: any) {
    super(options);
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
}
