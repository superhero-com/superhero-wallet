export default class WebCrypto {

    async encrypt(message, password, nonce, salt ) {
        let keyMaterial = await this.getKeyMaterial(password);
        let key = await this.getKey(keyMaterial, salt);
        let encoded = this.getMessageEncoding(message);

        let ciphertext = await window.crypto.subtle.encrypt(
            {
              name: "AES-GCM",
              iv:nonce
            },
            key,
            encoded
        );       

        return ciphertext
    }

    async decrypt(message, password, nonce, salt ) {
        message = Buffer.from(message, 'hex')
        nonce = Buffer.from(nonce, 'hex')
        salt = Buffer.from(salt, 'hex')
        let keyMaterial = await this.getKeyMaterial(password);
        let key = await this.getKey(keyMaterial, salt);

        try {
            let decrypted = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv:nonce
                },
                key,
                message
            );
            let dec = new TextDecoder();
            let decoded = dec.decode(decrypted);
            return decoded
        } catch (e) {
            return false
        }
    }

    getKeyMaterial(password) {
        let enc = new TextEncoder();
        return window.crypto.subtle.importKey(
          "raw", 
          enc.encode(password), 
          {name: "PBKDF2"}, 
          false, 
          ["deriveBits", "deriveKey"]
        );
    }
    getKey(keyMaterial, salt) {
        return window.crypto.subtle.deriveKey(
          {
            "name": "PBKDF2",
            salt: salt, 
            "iterations": 100000,
            "hash": "SHA-256"
          },
          keyMaterial,
          { "name": "AES-GCM", "length": 256},
          true,
          [ "encrypt", "decrypt" ]
        );
    }

    getMessageEncoding(message) {
        let enc = new TextEncoder();
        return enc.encode(message);
    }
}