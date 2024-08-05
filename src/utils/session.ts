import { CONNECTION_TYPES, IS_EXTENSION } from '@/constants';
import { exportPasswordKey, IKey, importPasswordKey } from './crypto';

/**
 * Stores the session key in the session storage.
 * Extension only.
 */
export async function startSession(sessionKey: IKey, timeout: number) {
  if (IS_EXTENSION) {
    browser.runtime.connect({ name: CONNECTION_TYPES.SESSION });
    const sessionExpires = Date.now() + timeout;
    // @ts-expect-error session storage is not defined
    await browser.storage.session.set(
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
  if (IS_EXTENSION) {
    // @ts-expect-error session storage is not defined
    await browser.storage.session.remove('sessionKey');
  }
}

/**
 * Extension only.
 */
export async function getSessionKey() {
  if (IS_EXTENSION) {
    // @ts-expect-error session storage is not defined
    const expires = await browser.storage.session.get('sessionExpires');
    const { sessionExpires } = expires;
    if (sessionExpires < Date.now()) {
      await endSession();
      return null;
    }

    // @ts-expect-error session storage is not defined
    const keyResult = await browser.storage.session.get('sessionKey');
    if (keyResult.sessionKey) {
      return importPasswordKey(keyResult.sessionKey);
    }
  }
  return null;
}
