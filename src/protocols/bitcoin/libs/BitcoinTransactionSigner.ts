import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import ECPairFactory from 'ecpair';
import { Signer } from 'bitcoinjs-lib';

export class BitcoinTransactionSigner implements Signer {
  secretKey: Buffer;

  publicKey: Buffer;

  constructor(secretKey: Buffer, publicKey: Buffer) {
    this.publicKey = publicKey;
    this.secretKey = secretKey;
  }

  sign(hash: Buffer) {
    const ECPair = ECPairFactory(ecc);
    return ECPair.fromPrivateKey(this.secretKey).sign(hash);
  }
}
