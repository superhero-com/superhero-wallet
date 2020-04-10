import { recover } from '@aeternity/aepp-sdk/es/utils/keystore';
import * as WebCrypto from './webCrypto';

export default async function(encryptedKeystore, key) {
  try {
    let decrypted = false;
    if (encryptedKeystore.crypto.kdf === 'argon2id') {
      // SDK keystore decrypt
      decrypted = await recover(key, encryptedKeystore);
    } else if (encryptedKeystore.crypto.kdf === 'webCrypto') {
      // webCrypto decrypt

      decrypted = await WebCrypto.decrypt(
        encryptedKeystore.crypto.ciphertext,
        key,
        encryptedKeystore.crypto.cipher_params.nonce,
        encryptedKeystore.crypto.kdf_params.salt,
      );
    }

    return decrypted;
  } catch (e) {
    return false;
  }
}
