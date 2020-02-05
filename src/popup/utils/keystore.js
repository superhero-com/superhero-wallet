import uuid from 'uuid';
import { encodeBase58Check } from '@aeternity/aepp-sdk/es/utils/crypto';
import WebCrypto from './webCrypto';

const nacl = require('tweetnacl');

const DEFAULTS = {
  crypto: {
    secret_type: 'ed25519',
    symmetric_alg: 'xsalsa20-poly1305',
    kdf: 'argon2id',
    kdf_params: {
      memlimit_kib: 65536,
      opslimit: 3,
      parallelism: 1,
    },
  },
};

export function getAddressFromPriv(secret) {
  const keys = nacl.sign.keyPair.fromSecretKey(str2buf(secret));
  const publicBuffer = Buffer.from(keys.publicKey);
  return `ak_${encodeBase58Check(publicBuffer)}`;
}

export function str2buf(str, enc) {
  if (!str || str.constructor !== String) return str;
  if (!enc && isHex(str)) enc = 'hex';
  if (!enc && isBase64(str)) enc = 'base64';
  return Buffer.from(str, enc);
}

/**
 * WebCrypto Support
 */

export async function generateEncryptedWallet(
  name,
  password,
  privateKey,
  nonce = window.crypto.getRandomValues(new Uint8Array(12)),
  salt = window.crypto.getRandomValues(new Uint8Array(16)),
  options = {}
) {
  const opt = Object.assign({}, DEFAULTS.crypto, options);
  opt.kdf = 'webCrypto';
  const webCrypto = new WebCrypto();
  const ciphertext = Buffer.from(await webCrypto.encrypt(Buffer.from(privateKey).toString('hex'), password, nonce, salt)).toString('hex');
  const encrypted = Object.assign(
    { name, version: 1, public_key: getAddressFromPriv(privateKey), id: uuid.v4() },
    {
      crypto: Object.assign(
        {
          secret_type: opt.secret_type,
          symmetric_alg: opt.symmetric_alg,
          ciphertext,
          cipher_params: { nonce: Buffer.from(nonce).toString('hex') },
        },
        { kdf: opt.kdf, kdf_params: { ...opt.kdf_params, salt: Buffer.from(salt).toString('hex') } }
      ),
    }
  );
  return encrypted;
}
