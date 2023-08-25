import {
  AensName,
  AeSdkWallet,
  sendTransaction,
  spend,
  Encoded,
} from '@aeternity/aepp-sdk';
import { Store } from 'vuex';
import { AccountSuperhero } from '@/lib/accounts/superhero';
import { useAeAccounts } from '@/protocols/aeternity/composables';

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

/**
 * Class extends `AeSdkWallet` from aepp-sdk-js
 * provides flexibility to manage the accounts the way wallet would like to handle
 */
export class AeSdkSuperhero extends AeSdkWallet {
  store: Store<any>;

  constructor(store: Store<any>, options: any) {
    super(options);
    this.store = store;
  }

  _resolveAccount() {
    return new AccountSuperhero(this.store);
  }

  getAccounts() {
    const { lastActiveAeAccount } = useAeAccounts({ store: this.store });
    return ({
      current: { [lastActiveAeAccount.value.address]: {} },
      connected: {
      },
    });
  }

  addresses() {
    const { aeAddressList } = useAeAccounts({ store: this.store });
    return aeAddressList.value as Encoded.AccountAddress[];
  }

  spendWithCustomOptions(
    amount: string | number,
    recipientId: Encoded.AccountAddress | AensName,
    options: ISpendOptions,
  ): ReturnType<typeof sendTransaction> {
    return super.spend(amount, recipientId, options as any); // TODO: remove type casting once https://github.com/aeternity/aepp-sdk-js/issues/1791 is resolved
  }
}
