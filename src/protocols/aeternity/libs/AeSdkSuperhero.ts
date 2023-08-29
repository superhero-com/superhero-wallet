import {
  AensName,
  AeSdkWallet,
  sendTransaction,
  spend,
  Encoded,
} from '@aeternity/aepp-sdk';
import { Store } from 'vuex';
import type { IWalletInfo } from '@/types';
import { PROTOCOL_AETERNITY } from '@/constants';
import { AccountSuperhero } from '@/lib/accounts/AccountSuperhero';
import { useAccounts } from '@/composables/accounts';

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
    const { getLastActiveProtocolAccount } = useAccounts({ store: this.store });
    const account = getLastActiveProtocolAccount(PROTOCOL_AETERNITY)!;
    return ({
      current: { [account.address]: {} },
      connected: {
      },
    });
  }

  addresses() {
    const { aeAccounts } = useAccounts({ store: this.store });
    return aeAccounts.value.map(({ address }) => address);
  }

  spendWithCustomOptions(
    amount: string | number,
    recipientId: Encoded.AccountAddress | AensName,
    options: ISpendOptions,
  ): ReturnType<typeof sendTransaction> {
    return super.spend(amount, recipientId, options as any); // TODO: remove type casting once https://github.com/aeternity/aepp-sdk-js/issues/1791 is resolved
  }

  async getWalletInfo(): Promise<IWalletInfo> {
    return {
      id: this.id,
      name: this.name,
      networkId: await this.api.getNetworkId(),
      origin: undefined as any,
      type: this._type as any,
    };
  }
}
