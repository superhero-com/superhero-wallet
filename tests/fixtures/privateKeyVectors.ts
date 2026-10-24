import type { Protocol } from '@/types';
import { EVM_PROTOCOLS, PROTOCOLS } from '@/constants';

export const RFC8032_TEST1_PUBLIC_KEY = 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';
/** Secret 1 gives the secp256k1 generator point, compressed as in SEC 2 section 2.4.1. */
export const SECP256K1_SECRET_1_PUBLIC_KEY = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';

/**
 * `[protocol, private key hex, mainnet address]` for published test keys,
 * so imports are never checked only against what this code derived before:
 * - web3.js docs key -> its documented address
 *   (https://web3js.readthedocs.io/en/v1.10.0/web3-eth-accounts.html#privatekeytoaccount);
 * - secp256k1 secret 1 -> the BIP173 P2WPKH test vector
 *   (https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki#test-vectors),
 *   and the Dogecoin P2PKH address derived from the same hash160;
 * - RFC 8032 Ed25519 test 1 secret -> its public key d75a9801…511a
 *   (https://www.rfc-editor.org/rfc/rfc8032#section-7.1), encoded in base58 and `ak_` form.
 */
export const PRIVATE_KEY_VECTORS: [Protocol, string, string][] = [
  ...EVM_PROTOCOLS.map((protocol): [Protocol, string, string] => [
    protocol,
    '4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318',
    '0x2c7536E3605D9C16a7a3D7b1898e529396a65c23',
  ]),
  [
    PROTOCOLS.bitcoin,
    '0000000000000000000000000000000000000000000000000000000000000001',
    'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
  ],
  [
    PROTOCOLS.dogecoin,
    '0000000000000000000000000000000000000000000000000000000000000001',
    'DFpN6QqFfUm3gKNaxN6tNcab1FArL9cZLE',
  ],
  [
    PROTOCOLS.solana,
    '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60',
    'FVen3X669xLzsi6N2V91DoiyzHzg1uAgqiT8jZ9nS96Z',
  ],
  [
    PROTOCOLS.aeternity,
    '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60',
    'ak_2dqvheyJXzEYpywfm8g7TshzLbaXWTwHKQPkh4rYX3Db2B3TPZ',
  ],
];
