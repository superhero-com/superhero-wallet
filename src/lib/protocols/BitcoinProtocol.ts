/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';

import { Store } from 'vuex';
import { IProtocol, SpendTransactionFee } from './IProtocol';
import { NETWORK_ID_MAINNET } from '../../popup/utils';

type BitcoinAddress = `bc_${string}` | string;

const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

export class BitcoinProtocol implements IProtocol {
  store: Store<any>;

  constructor(store: Store<any>) {
    this.store = store;
    this.getAddressFromPrivateKey('21');
  }

  getActiveNetwork() {
    return this.store.getters.activeNetwork.networkId === NETWORK_ID_MAINNET
      ? bitcoin.networks.bitcoin
      : bitcoin.networks.testnet;
  }

  async spend(amount: string, recipientId: BitcoinAddress, options: any): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async getBalance(address: BitcoinAddress): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async estimateFeeForSpendTransaction(amount: string): Promise<SpendTransactionFee> {
    throw new Error('Method not implemented.');
  }

  async getAddressFromMnemonic(mnemonic: string, derivationPath: string): Promise<BitcoinAddress> {
    const path = derivationPath || "m/44'/0'/0'/0/0";
    const seed = bip39.mnemonicToSeedSync(mnemonic);

    const node = bip32.fromSeed(seed);
    const child = node.derivePath(path);

    const { address, ...result } = bitcoin.payments.p2pkh({
      pubkey: child.publicKey,
      network: this.getActiveNetwork(),
    });
    return address as string;
  }
}
