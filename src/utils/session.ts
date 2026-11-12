import type { Runtime } from 'webextension-polyfill';
import {
  CONNECTION_TYPES,
  IS_EXTENSION,
  IS_FIREFOX,
  IS_OFFSCREEN_TAB,
  SESSION_METHODS,
} from '@/constants';
import type { SessionKeyMutation, SessionKeyMutationResult } from '@/lib/ExtensionSessionStorage';
import { getSessionEncryptionKey as getSessionEncryptionKeyOffscreen } from '@/offscreen/popupHandler';
import { exportEncryptionKey, importEncryptionKey } from './crypto';

const SESSION_STORAGE_KEYS = {
  exportedEncryptionKey: 'exportedEncryptionKey',
};

const storageSession = (browser.storage as any)?.session;

/** While open they keep the background from timing the session out. */
const sessionPorts: { port: Runtime.Port; started: Promise<void> }[] = [];
let mutations = Promise.resolve();

/** Register before exporting a key, so a later logout cannot be overtaken by that export. */
function enqueueMutation(task: () => Promise<void>): Promise<void> {
  const result = mutations.then(task);
  mutations = result.catch(() => {});
  return result;
}

async function mutateSessionKey(payload: SessionKeyMutation) {
  const response: SessionKeyMutationResult | undefined = await browser.runtime.sendMessage({
    target: IS_FIREFOX ? 'offscreen' : 'background',
    method: SESSION_METHODS.mutateSessionKey,
    payload,
  });
  if (!response?.ok) throw new Error(response?.error ?? 'The session could not be saved');
}

async function releasePorts(ports: typeof sessionPorts) {
  await Promise.all(ports.map(async ({ port, started }) => {
    // The offscreen tab learns about a new key only through its port.
    await started.catch(() => {});
    port.disconnect();
  }));
}

/**
 * Stores the password key in the session storage.
 * Extension only.
 */
export async function sessionStart(encryptionKey: CryptoKey) {
  if (IS_EXTENSION && !IS_OFFSCREEN_TAB) {
    // Before storing, so a page closed mid-write still lets the background time the key out.
    const port = browser.runtime.connect({ name: CONNECTION_TYPES.SESSION });
    const started = enqueueMutation(async () => {
      await mutateSessionKey({
        operation: 'set',
        key: Buffer.from(await exportEncryptionKey(encryptionKey)).toString('base64'),
      });
      // Chrome's offscreen documents can't watch `storage.session`.
      try {
        port.postMessage({ method: SESSION_METHODS.sessionKeyStored });
      } catch {
        // No offscreen tab yet: it reads the key when it boots.
      }
    });
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
  await releasePorts(sessionPorts.splice(0));
}

/**
 * Extension only.
 */
export async function sessionEnd() {
  if (IS_EXTENSION && !IS_OFFSCREEN_TAB) {
    const ports = sessionPorts.splice(0);
    try {
      await enqueueMutation(() => mutateSessionKey({ operation: 'clear' }));
    } finally {
      // Outside the mutation queue: the ports wait for their queued starts to finish.
      await releasePorts(ports);
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

/** Each read of the session makes a new key object, so the key bytes are compared. */
export async function isSameEncryptionKey(first: CryptoKey, second: CryptoKey) {
  const [a, b] = await Promise.all([exportEncryptionKey(first), exportEncryptionKey(second)]);
  return Buffer.from(a).equals(Buffer.from(b));
}

/**
 * Ends the session only while it still holds this key, not one another window stored since.
 * Extension only.
 */
export async function sessionEndIfHolding(encryptionKey: CryptoKey) {
  if (!IS_EXTENSION || IS_OFFSCREEN_TAB) return;
  await enqueueMutation(async () => mutateSessionKey({
    operation: 'clearIfMatching',
    key: Buffer.from(await exportEncryptionKey(encryptionKey)).toString('base64'),
  }));
}
