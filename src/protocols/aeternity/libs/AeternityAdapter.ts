/* eslint-disable class-methods-use-this */

import {
  Encoded,
  getHdWalletAccountFromSeed,
} from '@aeternity/aepp-sdk';
import { useStore } from 'vuex';
import type { IHdWalletAccount } from '@/types';
import { useAeSdk } from '@/composables/aeSdk';
import { MAXIMUM_ACCOUNTS_TO_DISCOVER } from '@/constants';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import {
  AE_COINGECKO_COIN_ID,
  AE_SYMBOL,
  AE_SYMBOL_SHORT,
} from '@/protocols/aeternity/config';

export class AeternityAdapter extends BaseProtocolAdapter {
  override getCoingeckoCoinId() {
    return AE_COINGECKO_COIN_ID;
  }

  override getCoinSymbol(getShort: boolean) {
    return getShort ? AE_SYMBOL_SHORT : AE_SYMBOL;
  }

  override async getBalance(address: Encoded.AccountAddress): Promise<string> {
    const store = useStore();
    const { getAeSdk } = useAeSdk({ store });
    const sdk = await getAeSdk();
    return sdk.getBalance(address);
  }

  override async isAccountUsed(address: string): Promise<boolean> {
    const store = useStore();
    const { getAeSdk } = useAeSdk({ store });
    const aeSdk = await getAeSdk();
    return aeSdk.api.getAccountByPubkey(address).then(() => true, () => false);
  }

  override getHdWalletAccountFromMnemonicSeed(
    seed: Uint8Array,
    accountIndex: number,
  ): IHdWalletAccount {
    const account = getHdWalletAccountFromSeed(seed, accountIndex);
    return {
      ...account,
      address: account.publicKey,
    };
  }

  override async discoverAccounts(seed: Uint8Array): Promise<number> {
    let lastNotEmptyIdx = 0;
    // First Aeternity account is present in the state, hence index starts from 1
    for (let i = 1; i < MAXIMUM_ACCOUNTS_TO_DISCOVER; i += 1) {
      const account = this.getHdWalletAccountFromMnemonicSeed(seed, i);
      // eslint-disable-next-line no-await-in-loop
      if (await this.isAccountUsed(account.publicKey)) {
        lastNotEmptyIdx = i - 1;
      }
    }
    return lastNotEmptyIdx;
  }
}
