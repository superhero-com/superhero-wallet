/* eslint-disable no-console, no-await-in-loop, max-classes-per-file -- Vault errors and retries. */
import { sha256 } from '@noble/hashes/sha2';
import { IS_MOBILE_APP, LOCAL_STORAGE_PREFIX, STORAGE_KEYS } from '@/constants';
import { decrypt, encrypt } from '@/utils/crypto';

/**
 * localStorage carries notifications only; IndexedDB holds the authoritative record.
 * Once it exists, the localStorage copies are ignored and removed, so a build rolled
 * back to before the vault would see no wallet: rollback builds must read the vault.
 */
export const VAULT_STORAGE_KEY = `${LOCAL_STORAGE_PREFIX}_vault-v1`;
export const VAULT_DB_NAME = `${LOCAL_STORAGE_PREFIX}-vault`;
export const VAULT_STORE_NAME = 'vault';
export const VAULT_RECORD_KEY = 'current';
export const VAULT_SECRET_KEYS = [
  STORAGE_KEYS.mnemonic, STORAGE_KEYS.privateKeyAccountsRaw, STORAGE_KEYS.preclaimedNames,
  STORAGE_KEYS.secureLoginTimeout, STORAGE_KEYS.invitesEncrypted,
] as const;
export const VAULT_KEYS = [
  ...VAULT_SECRET_KEYS, STORAGE_KEYS.encryptionSalt, STORAGE_KEYS.defaultPasswordSecret,
] as const;
export type VaultKey = typeof VAULT_KEYS[number];
export type VaultValues = Record<VaultKey, string | null>;
export interface VaultSnapshot {
  revision: string | null;
  values: VaultValues;
}
/** The raw localStorage copies, `null` where there is none. */
export type LegacyCopies = Record<VaultKey, string | null>;
interface VaultRecord extends VaultSnapshot {
  version: 1;
  reset?: boolean;
  /** Of the migrated copies, to tell them from ones an older version wrote since. */
  legacyDigests?: Partial<Record<VaultKey, string>>;
}
export class VaultConflictError extends Error {
  constructor() { super('The wallet changed while saving. Please try again'); }
}
export class VaultResetError extends Error {
  constructor() { super('The wallet was reset while storing data'); }
}
/** An older wallet version stored its own copies, which a new password wouldn't protect. */
export class VaultLegacyConflictError extends Error {
  constructor() { super('Another wallet version saved legacy data. Export its new keys before reloading it'); }
}
/** The browser storage holding the vault can't be opened or read, its data is unchanged. */
export class VaultUnavailableError extends Error {
  constructor(public cause: unknown) { super('The wallet storage is unavailable'); }
}

/** Flushed to disk before `complete`, so the localStorage copies can go after it. */
const DURABLE: IDBTransactionOptions = { durability: 'strict' };
/** Engines without the option (e.g. Firefox before 126) may lose a commit that just completed. */
const supportsDurability = (transaction: IDBTransaction) => typeof transaction.durability === 'string';

const listeners = new Set<(value: VaultSnapshot) => void>();
const legacyKey = (key: string) => `${LOCAL_STORAGE_PREFIX}_${key}`;
const digest = (value: string) => Buffer.from(sha256(value)).toString('hex');
let database: Promise<IDBDatabase> | undefined;
let ready: Promise<void> | undefined;
let cachedRecord: VaultRecord | null = null;
/** The vault never loaded here: the localStorage copies may be outdated, so none are read. */
let loadError: unknown;
let operation = 0;
let appliedOperation = 0;

function nextOperation() {
  operation += 1;
  return operation;
}

export function isVaultKey(key: string): key is VaultKey {
  return !IS_MOBILE_APP && (VAULT_KEYS as readonly string[]).includes(key);
}
function snapshot(record: VaultRecord): VaultSnapshot {
  return { revision: record.revision, values: { ...record.values } };
}
function validateRecord(value: unknown): asserts value is VaultRecord {
  const record = value as VaultRecord;
  if (record?.version !== 1 || typeof record.revision !== 'string'
    || !record.values || VAULT_KEYS.some((key) => (
    record.values[key] !== null && typeof record.values[key] !== 'string'
  ))) throw new Error('The stored wallet vault is invalid');
}

/** Synchronous, once `ensureVaultReady` resolved. */
export function readVault(): VaultSnapshot {
  if (cachedRecord) return snapshot(cachedRecord);
  if (loadError) throw loadError;
  const values = Object.fromEntries(VAULT_KEYS.map((key) => {
    const raw = localStorage.getItem(legacyKey(key));
    const value: unknown = raw === null ? null : JSON.parse(raw);
    if (value !== null && typeof value !== 'string') {
      throw new Error(`The stored wallet value "${key}" is invalid`);
    }
    return [key, value];
  })) as VaultValues;
  return { revision: null, values };
}

function openDatabase(): Promise<IDBDatabase> {
  if (!database) {
    database = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(VAULT_DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(VAULT_STORE_NAME);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('The wallet storage is busy'));
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); database = undefined; };
        // Closed by the browser, e.g. its data was cleared: opened again at the next access.
        db.onclose = () => { database = undefined; };
        resolve(db);
      };
    }).catch((error) => { database = undefined; throw new VaultUnavailableError(error); });
  }
  return database;
}
function publish(record: VaultRecord | null, sequence: number) {
  if (sequence < appliedOperation) return;
  appliedOperation = sequence;
  const changed = JSON.stringify(cachedRecord) !== JSON.stringify(record);
  cachedRecord = record;
  if (changed) {
    listeners.forEach((listener) => {
      try { listener(readVault()); } catch (error) { console.warn(error); }
    });
  }
}
function readLegacyCopies(): LegacyCopies {
  return Object.fromEntries(VAULT_KEYS.map((key) => (
    [key, localStorage.getItem(legacyKey(key))]
  ))) as LegacyCopies;
}
function digestsOf(copies: Partial<LegacyCopies>): Partial<Record<VaultKey, string>> {
  return Object.fromEntries(Object.entries(copies).flatMap(([key, value]) => (
    value == null ? [] : [[key, digest(value)]]
  )));
}
/** The copies there are now, each replaced by its value in `values` (`null` removes it). */
function replaceLegacyCopies(values: VaultValues): Partial<LegacyCopies> {
  return Object.fromEntries(VAULT_KEYS
    .filter((key) => localStorage.getItem(legacyKey(key)) !== null)
    .map((key) => [key, values[key] === null ? null : JSON.stringify(values[key])]));
}
/** All or none: a partial set could pair a new salt with the old ciphertext. */
function writeLegacyCopies(copies: Partial<LegacyCopies>) {
  try {
    Object.entries(copies).forEach(([key, value]) => {
      if (value == null) localStorage.removeItem(legacyKey(key));
      else localStorage.setItem(legacyKey(key), value);
    });
  } catch (error) {
    console.warn(error);
    VAULT_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(legacyKey(key));
      } catch (removeError) { console.warn(removeError); }
    });
  }
}
/** Throws when the copies can't be read, so they are treated as changed then. */
function hasLegacyConflict(record: VaultRecord) {
  return VAULT_KEYS.some((key) => {
    const value = localStorage.getItem(legacyKey(key));
    return value !== null && digest(value) !== record.legacyDigests?.[key];
  });
}
function cleanupLegacy(record: VaultRecord) {
  try {
    // All or none: a copy another version changed may need the old salt or secret beside it.
    if (hasLegacyConflict(record)) {
      console.warn(new VaultLegacyConflictError());
      return;
    }
  } catch (error) { console.warn(error); return; }
  VAULT_KEYS.forEach((key) => {
    try {
      const value = localStorage.getItem(legacyKey(key));
      if (value !== null && digest(value) === record.legacyDigests?.[key]) {
        localStorage.removeItem(legacyKey(key));
      }
    } catch (error) { console.warn(error); }
  });
}
export async function refreshVault(): Promise<void> {
  if (IS_MOBILE_APP) return;
  const db = await openDatabase();
  const sequence = nextOperation();
  await new Promise<void>((resolve, reject) => {
    let transaction: IDBTransaction;
    let request: IDBRequest;
    try {
      transaction = db.transaction(VAULT_STORE_NAME, 'readonly');
      request = transaction.objectStore(VAULT_STORE_NAME).get(VAULT_RECORD_KEY);
    } catch (error) {
      reject(new VaultUnavailableError(error));
      return;
    }
    transaction.oncomplete = () => {
      try {
        const record: unknown = request.result ?? null;
        // Invalid data is unreadable rather than unavailable: retrying won't help.
        if (record !== null) validateRecord(record);
        publish(record, sequence);
        loadError = undefined;
        // Finishes a cleanup cut off after its commit, once the record is surely on the disk.
        if (record !== null && cachedRecord === record && supportsDurability(transaction)) {
          cleanupLegacy(record);
        }
        resolve();
      } catch (error) { reject(error); }
    };
    transaction.onabort = () => reject(new VaultUnavailableError(transaction.error));
    transaction.onerror = () => reject(new VaultUnavailableError(transaction.error));
  });
}
export async function ensureVaultReady(): Promise<void> {
  if (IS_MOBILE_APP) return;
  if (!ready) {
    ready = refreshVault().catch((error) => {
      ready = undefined;
      if (!cachedRecord) loadError = error;
      throw error;
    });
  }
  await ready;
}
export function subscribeVault(listener: (value: VaultSnapshot) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
window.addEventListener('storage', (event) => {
  if (!IS_MOBILE_APP && (event.key === VAULT_STORAGE_KEY || event.key === null)) {
    refreshVault().catch((error) => console.warn(error));
  }
});
function announce(revision: string) {
  // A failed notification mustn't report the completed commit as failed.
  try { localStorage.setItem(VAULT_STORAGE_KEY, revision); } catch (error) { console.warn(error); }
}

/**
 * Replaces the record if it is still `expected`, in one transaction.
 * @param options.requireLegacyReconciled For a new password, refused while another wallet
 * version's localStorage copies are kept: they would still open with the old one. Where the
 * browser can't store durably, the copies kept as a fallback are replaced by the new values.
 */
export async function commitVault(
  expected: VaultSnapshot,
  values: VaultValues,
  assertCurrent: () => void = () => {},
  { requireLegacyReconciled = false }: { requireLegacyReconciled?: boolean } = {},
): Promise<VaultSnapshot> {
  if (IS_MOBILE_APP) throw new Error('Password vaults are not used on mobile');
  await ensureVaultReady();
  const db = await openDatabase();
  const sequence = nextOperation();
  return new Promise<VaultSnapshot>((resolve, reject) => {
    const transaction = db.transaction(VAULT_STORE_NAME, 'readwrite', DURABLE);
    const store = transaction.objectStore(VAULT_STORE_NAME);
    const request = store.get(VAULT_RECORD_KEY);
    let next: VaultRecord;
    let failure: unknown;
    let legacyReplacement: Partial<LegacyCopies> | undefined;
    request.onsuccess = () => {
      try {
        const previous: unknown = request.result ?? null;
        if (previous !== null) validateRecord(previous);
        const current = previous ? snapshot(previous) : { ...readVault(), revision: null };
        if (JSON.stringify(current) !== JSON.stringify(expected)) {
          publish(previous, sequence);
          if (previous?.reset) throw new VaultResetError();
          throw new VaultConflictError();
        }
        if (previous && requireLegacyReconciled && hasLegacyConflict(previous)) {
          throw new VaultLegacyConflictError();
        }
        assertCurrent();
        // Kept as a fallback without durability: an old password's copies mustn't stay.
        if (requireLegacyReconciled && !supportsDurability(transaction)) {
          legacyReplacement = replaceLegacyCopies(values);
        }
        const legacyDigests = legacyReplacement
          ? digestsOf(legacyReplacement)
          : previous?.legacyDigests ?? digestsOf(readLegacyCopies());
        next = {
          version: 1,
          revision: Buffer.from(globalThis.crypto.getRandomValues(new Uint8Array(16))).toString('hex'),
          values: { ...values },
          legacyDigests,
          reset: previous?.reset && !values[STORAGE_KEYS.mnemonic] ? true : undefined,
        };
        validateRecord(next);
        store.put(next, VAULT_RECORD_KEY);
      } catch (error) { failure = error; transaction.abort(); }
    };
    transaction.oncomplete = () => {
      publish(next, sequence);
      if (supportsDurability(transaction)) {
        cleanupLegacy(next);
      } else if (legacyReplacement) {
        writeLegacyCopies(legacyReplacement);
      } else {
        console.warn('Keeping the previous wallet storage, the browser may not have saved the vault yet');
      }
      announce(next.revision!);
      resolve(snapshot(next));
    };
    transaction.onabort = () => reject(failure ?? transaction.error);
    transaction.onerror = () => { failure ??= transaction.error; };
  });
}

/** Fails with `VaultConflictError` once the vault isn't `expected` (default: the latest). */
export async function writeVaultField(
  key: VaultKey,
  value: string | null,
  expected?: VaultSnapshot,
): Promise<void> {
  await ensureVaultReady();
  if (!expected) await refreshVault();
  const current = expected ?? readVault();
  if (current.values[key] === value) return;
  await commitVault(current, { ...current.values, [key]: value });
}
export async function updateVaultSecret(
  key: VaultKey,
  encryptionKey: CryptoKey,
  update: (plaintext: string | null) => string,
  assertCurrent: () => void = () => {},
): Promise<string> {
  await ensureVaultReady();
  await refreshVault();
  const initialSalt = readVault().values[STORAGE_KEYS.encryptionSalt];
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const current = readVault();
    if (cachedRecord?.reset) throw new VaultResetError();
    if (current.values[STORAGE_KEYS.encryptionSalt] !== initialSalt) {
      throw new Error('The password changed while saving wallet data');
    }
    assertCurrent();
    if (current.values[STORAGE_KEYS.mnemonic]) {
      await decrypt(encryptionKey, current.values[STORAGE_KEYS.mnemonic]!);
    }
    const previous = current.values[key];
    const plaintext = previous ? await decrypt(encryptionKey, previous) : null;
    const ciphertext = await encrypt(encryptionKey, update(plaintext));
    try {
      await commitVault(current, { ...current.values, [key]: ciphertext }, assertCurrent);
      return ciphertext;
    } catch (error) {
      if (!(error instanceof VaultConflictError)) throw error;
      await refreshVault();
    }
  }
  throw new VaultConflictError();
}
/** Old copies go only after the empty record is stored, a failed reset deletes nothing. */
export async function clearVault(): Promise<void> {
  const db = await openDatabase();
  const sequence = nextOperation();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(VAULT_STORE_NAME, 'readwrite', DURABLE);
    // An empty generation fences off operations that started before the reset.
    const empty: VaultRecord = {
      version: 1,
      reset: true,
      revision: Buffer.from(globalThis.crypto.getRandomValues(new Uint8Array(16))).toString('hex'),
      values: Object.fromEntries(VAULT_KEYS.map((key) => [key, null])) as VaultValues,
    };
    transaction.objectStore(VAULT_STORE_NAME).put(empty, VAULT_RECORD_KEY);
    transaction.oncomplete = () => {
      VAULT_KEYS.forEach((key) => {
        try { localStorage.removeItem(legacyKey(key)); } catch (error) { console.warn(error); }
      });
      publish(empty, sequence);
      announce(empty.revision!);
      resolve();
    };
    transaction.onabort = () => reject(transaction.error);
    transaction.onerror = () => reject(transaction.error);
  });
}
