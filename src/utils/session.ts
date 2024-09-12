import type { IEncryptionData } from '@/types';
import { CONNECTION_TYPES, IS_EXTENSION, IS_OFFSCREEN_TAB } from '@/constants';
import { getSessionEncryptionData as getSessionEncryptionDataOffscreen } from '@/offscreen/popupHandler';
import { exportEncryptionData, importEncryptionData } from './crypto';

const SESSION_STORAGE_KEYS = {
  encryptionData: 'encryptionData',
  sessionExpires: 'sessionExpires',
};

const storageSession = (browser.storage as any)?.session;

/**
 * Stores the password key in the session storage.
 * Extension only.
 */
export async function startSession(encryptionData: IEncryptionData, timeout: number) {
  if (IS_EXTENSION && !IS_OFFSCREEN_TAB) {
    browser.runtime.connect({ name: CONNECTION_TYPES.SESSION });
    const sessionExpires = Date.now() + timeout;
    await storageSession.set(
      {
        encryptionData: await exportEncryptionData(encryptionData),
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
    await storageSession.remove(SESSION_STORAGE_KEYS.encryptionData);
  }
}

/**
 * Extension only.
 */
export async function getSessionEncryptionData() {
  if (IS_OFFSCREEN_TAB) {
    const sessionEncryptionData = await getSessionEncryptionDataOffscreen();
    if (sessionEncryptionData) {
      const decodedEncryptionData = {
        key: Buffer.from(sessionEncryptionData.key, 'base64'),
        salt: Buffer.from(sessionEncryptionData.salt, 'base64'),
        iv: Buffer.from(sessionEncryptionData.iv, 'base64'),
      };
      return importEncryptionData(decodedEncryptionData);
    }
    return null;
  }

  if (IS_EXTENSION) {
    const { sessionExpires } = await storageSession.get(SESSION_STORAGE_KEYS.sessionExpires);
    if (!sessionExpires || sessionExpires < Date.now()) {
      await endSession();
      return null;
    }
    const { encryptionData } = await storageSession.get(SESSION_STORAGE_KEYS.encryptionData);
    if (encryptionData) {
      return importEncryptionData(encryptionData);
    }
  }
  return null;
}
