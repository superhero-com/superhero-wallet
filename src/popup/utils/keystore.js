
import WebCrypto from './webCrypto';

/**
 * WebCrypto Support
 */

export async function generateEncryptedWallet(name, password, privateKey, nonce = window.crypto.getRandomValues(new Uint8Array(12)), salt = window.crypto.getRandomValues(new Uint8Array(16)), options = {}) {
  const opt = Object.assign({}, DEFAULTS.crypto, options);
  opt.kdf = "webCrypto";
  let webCrypto = new WebCrypto();
  let ciphertext =  Buffer.from(await webCrypto.encrypt(Buffer.from(privateKey).toString('hex'), password, nonce, salt)).toString('hex');
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