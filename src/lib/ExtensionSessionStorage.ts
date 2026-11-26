/** Shared by the Chrome worker and Firefox background page; imports must not need a DOM. */
export const SESSION_ENCRYPTION_KEY = 'exportedEncryptionKey';

export type SessionKeyMutation =
  | { operation: 'set' | 'clearIfMatching'; key: string }
  | { operation: 'clear' };
export type SessionKeyMutationResult = { ok: true } | { ok: false; error: string };

let mutations = Promise.resolve();

function decodeKey(value: unknown): Uint8Array {
  if (typeof value !== 'string') throw new Error('Invalid session key');
  const bytes = Buffer.from(value, 'base64');
  if (bytes.length !== 32 || bytes.toString('base64') !== value) {
    throw new Error('Invalid session key');
  }
  return new Uint8Array(bytes);
}

/** Only the background owner calls this: no other context may write the session key. */
export function mutateSessionKey(
  mutation: SessionKeyMutation,
  isCurrent: () => boolean = () => true,
): Promise<void> {
  const result = mutations.then(async () => {
    // A timeout may have been stopped or rescheduled while waiting in this queue.
    if (!isCurrent()) return;
    const storage = (browser.storage as any).session;
    if (mutation.operation === 'set') {
      await storage.set({ [SESSION_ENCRYPTION_KEY]: decodeKey(mutation.key) });
    } else if (mutation.operation === 'clearIfMatching') {
      const expected = decodeKey(mutation.key);
      const stored = (await storage.get(SESSION_ENCRYPTION_KEY))[SESSION_ENCRYPTION_KEY];
      if (stored && Buffer.from(stored).equals(Buffer.from(expected))) {
        await storage.remove(SESSION_ENCRYPTION_KEY);
      }
    } else {
      await storage.remove(SESSION_ENCRYPTION_KEY);
    }
  });
  // A failed write must not prevent a later login or lock.
  mutations = result.catch(() => {});
  return result;
}

/** Runtime messages use plain values and report failures explicitly on both browsers. */
export async function handleSessionKeyMutation(
  payload: unknown,
): Promise<SessionKeyMutationResult> {
  try {
    const mutation = payload as SessionKeyMutation | undefined;
    if (!mutation || !['set', 'clear', 'clearIfMatching'].includes(mutation.operation)) {
      throw new Error('Invalid session mutation');
    }
    if (mutation.operation !== 'clear') decodeKey(mutation.key);
    await mutateSessionKey(mutation);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
