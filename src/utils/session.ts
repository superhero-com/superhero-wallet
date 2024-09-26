import { CONNECTION_TYPES, IS_EXTENSION, IS_OFFSCREEN_TAB } from '@/constants';
import { getSessionEncryptionKey as getSessionEncryptionKeyOffscreen } from '@/offscreen/popupHandler';
import { exportEncryptionKey, importEncryptionKey } from './crypto';

const SESSION_STORAGE_KEYS = {
  exportedEncryptionKey: 'exportedEncryptionKey',
  sessionExpires: 'sessionExpires',
  sessionStart: 'sessionStart',
};

const storageSession = (browser.storage as any)?.session;

/**
 * Stores the password key in the session storage.
 * Extension only.
 */
export async function startSession(encryptionKey: CryptoKey, timeout: number) {
  if (IS_EXTENSION && !IS_OFFSCREEN_TAB) {
    browser.runtime.connect({ name: CONNECTION_TYPES.SESSION });

    const sessionStart = Date.now();
    const sessionExpires = sessionStart + timeout;

    // Store the encryption key and session metadata
    await storageSession.set({
      exportedEncryptionKey: await exportEncryptionKey(encryptionKey),
      sessionExpires,
      sessionStart,
    });
  }
}

/**
 * Extension only.
 */
export async function endSession() {
  if (IS_EXTENSION && !IS_OFFSCREEN_TAB) {
    await storageSession.remove([
      SESSION_STORAGE_KEYS.exportedEncryptionKey,
      SESSION_STORAGE_KEYS.sessionExpires,
      SESSION_STORAGE_KEYS.sessionStart,
    ]);
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
    const { sessionExpires, sessionStart } = await storageSession.get([
      SESSION_STORAGE_KEYS.sessionExpires,
      SESSION_STORAGE_KEYS.sessionStart,
    ]);

    // Check for invalid session or time manipulation
    if (
      !sessionExpires
      || !sessionStart
      || sessionExpires < Date.now()
      || Date.now() < sessionStart
    ) {
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
