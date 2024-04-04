/* eslint-disable class-methods-use-this */

import {
  AensName,
  AeSdkWallet,
  sendTransaction,
  spend,
  Encoded,
} from '@aeternity/aepp-sdk';
import { Accounts } from '@aeternity/aepp-sdk/es/aepp-wallet-communication/rpc/types';
import { Ref } from 'vue';
import type { IWalletInfo } from '@/types';
import { PROTOCOLS } from '@/constants';
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

let aeAccountHdWallet: AeAccountHdWallet;

export class AeSdkSuperhero extends AeSdkWallet {
  nodeNetworkId: Ref<string | undefined>;

  constructor(options: any, nodeNetworkId: Ref<string | undefined>) {
    super(options);
    this.nodeNetworkId = nodeNetworkId;
  }

  _resolveAccount() {
    if (!aeAccountHdWallet) {
      aeAccountHdWallet = new AeAccountHdWallet(this.nodeNetworkId);
    }

    return aeAccountHdWallet;
  }

  getAccounts() {
    const accounts: Accounts = { connected: {}, current: {} };
    const { getLastActiveProtocolAccount } = useAccounts();
    const account = getLastActiveProtocolAccount(PROTOCOLS.aeternity)!;

    if (account) {
      accounts.current[account.address as Encoded.AccountAddress] = {};
    }

    return accounts;
  }

  addresses() {
    const { aeAccounts } = useAccounts();
    return aeAccounts.value.map(({ address }) => address as Encoded.AccountAddress);
  }

  spendWithCustomOptions(
    amount: string | number,
    recipientId: Encoded.AccountAddress | AensName,
    options: ISpendOptions,
  ): ReturnType<typeof sendTransaction> {
    return super.spend(amount, recipientId, options);
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
