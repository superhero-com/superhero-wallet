/* eslint-disable */

import { generateEncryptedWallet } from './keystore'
import { dump, recover } from '@aeternity/aepp-sdk/es/utils/keystore';
import * as Crypto from '@aeternity/aepp-sdk/es/utils/crypto'
import { getHdWalletAccount } from './hdWallet';
import WebCrypto from './webCrypto';
        

const nacl = require('tweetnacl')

export const addressGenerator = {
  generateKeyPair,
  importPrivateKey,
  decryptKeystore
}

const webCrypto = new WebCrypto();

export function printUnderscored (key, val) {
  print(`${key}${R.repeat('_', WIDTH - key.length).reduce((a, b) => a += b, '')} ${typeof val !== 'object' ? val : JSON.stringify(val)}`)
} 


async function generateKeyPair (passphrase, privateKey, address) {
  const hexStr = await Crypto.hexStringToByte(privateKey.trim())
  const keys = await Crypto.generateKeyPairFromSecret(hexStr)
  // SDK keystore
  // const keystore = await dump('keystore', passphrase, keys.secretKey);

  // webCrypto
  const keystore = await generateEncryptedWallet('keystore', passphrase, keys.secretKey)
  keystore.public_key = address;
  return {
    publicKey: keystore.public_key,
    encryptedPrivateKey: JSON.stringify(keystore)
  };
}

async function importPrivateKey (passphrase, secretKey, address) {
  const hexStr = await Crypto.hexStringToByte(secretKey.trim())
  const keys = await Crypto.generateKeyPairFromSecret(hexStr)

  // SDK keystore
  // const keystore = await dump('keystore', passphrase, keys.secretKey);

  // web Crypto
  const keystore = await generateEncryptedWallet('keystore', passphrase, keys.secretKey)
  keystore.public_key = address;
  return {
    publicKey: keystore.public_key,
    encryptedPrivateKey: JSON.stringify(keystore),
  };
}

async function decryptKeystore(encryptedKeystore, key) {
  try {
    let decrypted = false
    if(encryptedKeystore.crypto.kdf == "argon2id") {
      // SDK keystore decrypt
      decrypted = await recover(key, encryptedKeystore)
    } else if(encryptedKeystore.crypto.kdf == "webCrypto") {
      // webCrypto decrypt
    
      decrypted = await webCrypto.decrypt(encryptedKeystore.crypto.ciphertext,
                key,
                encryptedKeystore.crypto.cipher_params.nonce,
                encryptedKeystore.crypto.kdf_params.salt); 
    }
    

    
    return decrypted
  } catch(e) {
    return false
  }
}

export const encryptMnemonic = async (mnemonic, password, nonce = new Uint8Array(12), salt = new Uint8Array(16) ) => {
  return Buffer.from(await webCrypto.encrypt(mnemonic, password, nonce, salt)).toString('hex');
}

export const decryptMnemonic = async (mnemonic, password, nonce = new Uint8Array(12), salt = new Uint8Array(16)) => {
  let dec = await webCrypto.decrypt(mnemonic, password, nonce, salt)
  if(dec) {
    return dec
  }
  return false
}