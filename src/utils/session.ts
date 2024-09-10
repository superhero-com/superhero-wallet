import type { IKey } from '@/types';
import { CONNECTION_TYPES, IS_EXTENSION, IS_OFFSCREEN_TAB } from '@/constants';
import { getSession } from '@/offscreen/popupHandler';
import { exportPasswordKey, importPasswordKey } from './crypto';

const storageSession = (browser.storage as any)?.session;

/**
 * Stores the session key in the session storage.
 * Extension only.
 */
export async function startSession(sessionKey: IKey, timeout: number) {
  if (IS_EXTENSION && !IS_OFFSCREEN_TAB) {
    browser.runtime.connect({ name: CONNECTION_TYPES.SESSION });
    const sessionExpires = Date.now() + timeout;
    await storageSession.set(
      {
        sessionKey: await exportPasswordKey(sessionKey),
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
    await storageSession.remove('sessionKey');
  }
}

/**
 * Extension only.
 */
export async function getSessionKey() {
  if (IS_OFFSCREEN_TAB) {
    const sessionKey = await getSession();
    if (sessionKey) {
      const decodedKey = {
        key: Buffer.from(sessionKey.key, 'base64'),
        salt: Buffer.from(sessionKey.salt, 'base64'),
        iv: Buffer.from(sessionKey.iv, 'base64'),
      };
      return importPasswordKey(decodedKey);
    }
    return null;
  }
  if (IS_EXTENSION) {
    const expires = await storageSession.get('sessionExpires');
    const { sessionExpires } = expires;
    if (sessionExpires < Date.now() || !sessionExpires) {
      await endSession();
      return null;
    }

    const keyResult = await storageSession.get('sessionKey');
    if (keyResult.sessionKey) {
      return importPasswordKey(keyResult.sessionKey);
    }
  }
  return null;
}
