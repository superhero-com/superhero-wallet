import { CONNECTION_TYPES, IS_EXTENSION, IS_OFFSCREEN_TAB } from '@/constants';
import { getSessionEncryptionKey as getSessionEncryptionKeyOffscreen } from '@/offscreen/popupHandler';
import { exportEncryptionKey, importEncryptionKey } from './crypto';

const SESSION_STORAGE_KEYS = {
  exportedEncryptionKey: 'exportedEncryptionKey',
  sessionExpires: 'sessionExpires',
};

const storageSession = (browser.storage as any)?.session;

/**
 * Stores the password key in the session storage.
 * Extension only.
 */
export async function startSession(encryptionKey: CryptoKey, timeout: number) {
  if (IS_EXTENSION && !IS_OFFSCREEN_TAB) {
    browser.runtime.connect({ name: CONNECTION_TYPES.SESSION });
    const sessionExpires = Date.now() + timeout;
    await storageSession.set(
      {
        exportedEncryptionKey: await exportEncryptionKey(encryptionKey),
        sessionExpires,
      },
    );
  }
}

/**
 * Extension only.
 */
export async function endSession() {
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
    const { sessionExpires } = await storageSession.get(SESSION_STORAGE_KEYS.sessionExpires);
    if (!sessionExpires || sessionExpires < Date.now()) {
      await endSession();
      return null;
    }
    const { exportedEncryptionKey } = await storageSession.get(
      SESSION_STORAGE_KEYS.exportedEncryptionKey,
    );
    if (exportedEncryptionKey) {
      return importEncryptionKey(exportedEncryptionKey);
    }
  }
  return null;
}
