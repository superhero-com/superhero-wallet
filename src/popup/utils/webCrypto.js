function getKeyMaterial(password) {
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']);
}

function getKey(keyMaterial, salt) {
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

function getMessageEncoding(message) {
  const enc = new TextEncoder();
  return enc.encode(message);
}

export async function encrypt(message, password, nonce, salt) {
  const keyMaterial = await getKeyMaterial(password);
  const key = await getKey(keyMaterial, salt);
  const encoded = getMessageEncoding(message);

  return window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
    },
    key,
    encoded
  );
}

export async function decrypt(message, password, nonce, salt) {
  const keyMaterial = await getKeyMaterial(password);
  const key = await getKey(keyMaterial, Buffer.from(salt, 'hex'));

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: Buffer.from(nonce, 'hex'),
      },
      key,
      Buffer.from(message, 'hex')
    );
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (e) {
    return false;
  }
}
