import * as ecc from '@bitcoinerlab/secp256k1';
import ECPairFactory from 'ecpair';

import { BitcoinTransactionSigner } from '@/protocols/bitcoin/libs/BitcoinTransactionSigner';

/**
 * `BitcoinTransactionSigner` implements bitcoinjs-lib's `Signer` interface:
 * given a secret/public key pair, `sign(hash)` must produce an ECDSA
 * signature that verifies against the *matching* public key under the
 * standard secp256k1 verification algorithm (an external, independently
 * checkable criterion -- not the class re-checking its own output), and must
 * NOT verify against an unrelated public key.
 */
describe('BitcoinTransactionSigner', () => {
  const ECPair = ECPairFactory(ecc);

  it('produces a signature that verifies against the matching public key', () => {
    const keyPair = ECPair.makeRandom();
    const signer = new BitcoinTransactionSigner(
      Buffer.from(keyPair.privateKey!),
      Buffer.from(keyPair.publicKey),
    );
    const hash = Buffer.alloc(32, 7); // arbitrary 32-byte "sighash" stand-in

    const signature = signer.sign(hash);

    expect(ECPair.fromPublicKey(Buffer.from(keyPair.publicKey)).verify(hash, signature)).toBe(true);
  });

  it('a signature does NOT verify against an unrelated public key', () => {
    const keyPair = ECPair.makeRandom();
    const otherKeyPair = ECPair.makeRandom();
    const signer = new BitcoinTransactionSigner(
      Buffer.from(keyPair.privateKey!),
      Buffer.from(keyPair.publicKey),
    );
    const hash = Buffer.alloc(32, 3);

    const signature = signer.sign(hash);

    expect(
      ECPair.fromPublicKey(Buffer.from(otherKeyPair.publicKey)).verify(hash, signature),
    ).toBe(false);
  });

  it('signing the same hash twice with the same key is internally consistent (deterministic or not, both must verify)', () => {
    const keyPair = ECPair.makeRandom();
    const signer = new BitcoinTransactionSigner(
      Buffer.from(keyPair.privateKey!),
      Buffer.from(keyPair.publicKey),
    );
    const hash = Buffer.alloc(32, 42);

    const sig1 = signer.sign(hash);
    const sig2 = signer.sign(hash);

    expect(ECPair.fromPublicKey(Buffer.from(keyPair.publicKey)).verify(hash, sig1)).toBe(true);
    expect(ECPair.fromPublicKey(Buffer.from(keyPair.publicKey)).verify(hash, sig2)).toBe(true);
  });

  it('exposes the public key it was constructed with (Signer interface contract)', () => {
    const keyPair = ECPair.makeRandom();
    const pub = Buffer.from(keyPair.publicKey);
    const signer = new BitcoinTransactionSigner(Buffer.from(keyPair.privateKey!), pub);

    expect(signer.publicKey).toBe(pub);
  });
});
