/* eslint-disable class-methods-use-this */

import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import { BIP32Factory } from 'bip32';
import { payments, networks } from 'bitcoinjs-lib';
import type { IHdWalletAccount } from '@/types';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import { MAXIMUM_ACCOUNTS_TO_DISCOVER } from '@/constants';

export class BitcoinAdapter extends BaseProtocolAdapter {
  bip32 = BIP32Factory(ecc);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async getBalance(address: string): Promise<string> {
    // TODO: Implement this once the mdw is ready
    return Promise.resolve('989983200000000000');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async isAccountUsed(address: string): Promise<boolean> {
    // TODO: Implement this
    return true;
  }

  override getHdWalletAccountFromMnemonicSeed(
    seed: Uint8Array,
    accountIndex: number,
  ): IHdWalletAccount {
    const node = this.bip32.fromSeed(Buffer.from(seed));
    const path = `m/84'/0'/${accountIndex}'/0/0`; // 44 for Legacy
    const child = node.derivePath(path);
    const { address } = payments.p2wpkh({ // p2pkh for Legacy
      pubkey: child.publicKey,
      // TODO: use bitcoin.networks.testnet once the network selection is ready
      network: networks.bitcoin,
    });
    const secretKey = child.toWIF();

    return {
      secretKey,
      publicKey: child.publicKey!.toString('utf8'),
      address: address!,
    };
  }

  override async discoverAccounts(seed: Uint8Array): Promise<number> {
    let lastNotEmptyIdx = 0;

    for (let i = 0; i < MAXIMUM_ACCOUNTS_TO_DISCOVER; i += 1) {
      const account = this.getHdWalletAccountFromMnemonicSeed(seed, i);
      // eslint-disable-next-line no-await-in-loop
      if (await this.isAccountUsed(account.publicKey)) {
        lastNotEmptyIdx = i;
      }
    }
    return lastNotEmptyIdx;
  }
}
