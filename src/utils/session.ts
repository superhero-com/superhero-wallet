import {
  CONNECTION_TYPES,
  IS_EXTENSION,
  IS_OFFSCREEN_TAB,
  SESSION_METHODS,
} from '@/constants';
import { getSessionEncryptionKey as getSessionEncryptionKeyOffscreen } from '@/offscreen/popupHandler';
import { exportEncryptionKey, importEncryptionKey } from './crypto';

const SESSION_STORAGE_KEYS = {
  exportedEncryptionKey: 'exportedEncryptionKey',
};

const storageSession = (browser.storage as any)?.session;

/**
 * Stores the password key in the session storage.
 * Extension only.
 */
export async function sessionStart(encryptionKey: CryptoKey) {
  if (IS_EXTENSION && !IS_OFFSCREEN_TAB) {
    // Before storing: the port's disconnect starts the session timeout, even mid-write.
    const port = browser.runtime.connect({ name: CONNECTION_TYPES.SESSION });
    await storageSession.set({
      [SESSION_STORAGE_KEYS.exportedEncryptionKey]: await exportEncryptionKey(encryptionKey),
    });
    // Chrome's offscreen documents can't watch `storage.session`.
    try {
      port.postMessage({ method: SESSION_METHODS.sessionKeyStored });
    } catch {
      // No offscreen tab yet: it reads the key when it boots.
    }
  }
}

/**
 * Extension only.
 */
export async function sessionEnd() {
  if (IS_EXTENSION && !IS_OFFSCREEN_TAB) {
    await storageSession.remove(SESSION_STORAGE_KEYS.exportedEncryptionKey);
  }
}

/**
 * Extension only.
 */
export async function getSessionEncryptionKey() {
  if (IS_OFFSCREEN_TAB) {
    const sessionEncryptionKey = await getSessionEncryptionKeyOffscreen();
    if (sessionEncryptionKey) {
      return importEncryptionKey(Buffer.from(sessionEncryptionKey, 'base64'));
    }
  } else if (IS_EXTENSION) {
    const { exportedEncryptionKey } = await storageSession.get(
      SESSION_STORAGE_KEYS.exportedEncryptionKey,
    );
    if (exportedEncryptionKey) {
      return importEncryptionKey(exportedEncryptionKey);
    }
  }
  return null;
}
