import type { Runtime } from 'webextension-polyfill';
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

/** While open they keep the background from timing the session out. */
const sessionPorts: { port: Runtime.Port; started: Promise<void> }[] = [];

/**
 * Stores the password key in the session storage.
 * Extension only.
 */
export async function sessionStart(encryptionKey: CryptoKey) {
  if (IS_EXTENSION && !IS_OFFSCREEN_TAB) {
    // Before storing, so a page closed mid-write still lets the background time the key out.
    const port = browser.runtime.connect({ name: CONNECTION_TYPES.SESSION });
    const started = (async () => {
      await storageSession.set({
        [SESSION_STORAGE_KEYS.exportedEncryptionKey]: await exportEncryptionKey(encryptionKey),
      });
      // Chrome's offscreen documents can't watch `storage.session`.
      try {
        port.postMessage({ method: SESSION_METHODS.sessionKeyStored });
      } catch {
        // No offscreen tab yet: it reads the key when it boots.
      }
    })();
    sessionPorts.push({ port, started });
    await started;
  }
}

/**
 * Keeps the session of an unlocked page that is shown again, see `sessionRelease`.
 * Extension only.
 */
export function sessionHold() {
  if (IS_EXTENSION && !IS_OFFSCREEN_TAB && !sessionPorts.length) {
    sessionPorts.push({
      port: browser.runtime.connect({ name: CONNECTION_TYPES.SESSION }),
      started: Promise.resolve(),
    });
  }
}

/**
 * Lets the background time the session out, e.g. once the page is hidden or locked.
 * Extension only.
 */
export async function sessionRelease() {
  await Promise.all(sessionPorts.splice(0).map(async ({ port, started }) => {
    // The offscreen tab learns about a new key only through its port.
    await started.catch(() => {});
    port.disconnect();
  }));
}

/**
 * Extension only.
 */
export async function sessionEnd() {
  if (IS_EXTENSION && !IS_OFFSCREEN_TAB) {
    try {
      await storageSession.remove(SESSION_STORAGE_KEYS.exportedEncryptionKey);
    } finally {
      await sessionRelease();
    }
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
