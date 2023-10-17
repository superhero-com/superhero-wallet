/* eslint-disable class-methods-use-this */

import {
  AensName,
  AeSdkWallet,
  sendTransaction,
  spend,
  Encoded,
} from '@aeternity/aepp-sdk';
import { Ref } from 'vue';
import type { IWalletInfo } from '@/types';
import { PROTOCOL_AETERNITY } from '@/constants';
import { useAccounts } from '@/composables/accounts';
import { AeAccountHdWallet } from './AeAccountHdWallet';

type ISpendOptions = Omit<Parameters<typeof spend>[2], 'onAccount' | 'onNode'>
  & {
    payload?: Encoded.Any; // support payload along with the transaction
  }

/**
 * Class extends `AeSdkWallet` from aepp-sdk-js
 * provides flexibility to manage the accounts the way wallet would like to handle
 */
export class AeSdkSuperhero extends AeSdkWallet {
  nodeNetworkId: Ref<string | undefined>;

  constructor(options: any, nodeNetworkId: Ref<string | undefined>) {
    super(options);
    this.nodeNetworkId = nodeNetworkId;
  }

  _resolveAccount() {
    // TODO cache the account instead of instantiating it whenever the library is asked for it
    return new AeAccountHdWallet(this.nodeNetworkId);
  }

  getAccounts() {
    const { getLastActiveProtocolAccount } = useAccounts();
    const account = getLastActiveProtocolAccount(PROTOCOL_AETERNITY)!;
    return {
      current: { [account.address]: {} },
      connected: {},
    };
  }

  addresses() {
    const { aeAccounts } = useAccounts();
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
