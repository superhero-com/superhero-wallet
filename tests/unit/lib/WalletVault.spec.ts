// @ts-nocheck
import { IDBDatabase, IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { LOCAL_STORAGE_PREFIX, STORAGE_KEYS } from '@/constants/common';

const rawKey = (key) => `${LOCAL_STORAGE_PREFIX}_${key}`;
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

describe('WalletVault', () => {
  let vault;
  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    vi.doMock('@/constants', async () => ({
      ...await vi.importActual('@/constants'), IS_MOBILE_APP: false,
    }));
    vault = await import('@/lib/WalletVault');
  });
  afterEach(() => { vi.restoreAllMocks(); });

  function seedLegacy() {
    const values = Object.fromEntries(vault.VAULT_KEYS.map((key, index) => [key, index === 2 ? null : `stored-${key}=`]));
    Object.entries(values).forEach(([key, value]) => {
      if (value !== null) localStorage.setItem(rawKey(key), JSON.stringify(value));
    });
    return values;
  }
  const stored = () => Object.fromEntries(Object.keys(localStorage)
    .map((key) => [key, localStorage.getItem(key)]));
  async function reload() {
    vi.resetModules();
    const restarted = await import('@/lib/WalletVault');
    await restarted.ensureVaultReady();
    return restarted;
  }
  async function current() {
    await vault.ensureVaultReady();
    return vault.readVault();
  }
  const failWrites = () => vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
    throw new DOMException('Vault quota exceeded', 'QuotaExceededError');
  });
  async function corruptAuthority(record) {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(vault.VAULT_DB_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(vault.VAULT_STORE_NAME, 'readwrite');
        transaction.objectStore(vault.VAULT_STORE_NAME).put(record, vault.VAULT_RECORD_KEY);
        transaction.oncomplete = resolve;
        transaction.onabort = () => reject(transaction.error);
      });
    } finally { db.close(); }
  }

  it('reads legacy ciphertext and missing slots without migrating or writing', async () => {
    const values = seedLegacy();
    const before = stored();
    const put = vi.spyOn(IDBObjectStore.prototype, 'put');
    expect(vault.readVault()).toEqual({ revision: null, values });
    expect((await reload()).readVault()).toEqual({ revision: null, values });
    expect(stored()).toEqual(before);
    expect(put).not.toHaveBeenCalled();
  });

  it('includes every encrypted slot and the password metadata', () => {
    expect(vault.VAULT_SECRET_KEYS).toEqual(expect.arrayContaining([
      STORAGE_KEYS.mnemonic, STORAGE_KEYS.privateKeyAccountsRaw, STORAGE_KEYS.invitesEncrypted,
      STORAGE_KEYS.preclaimedNames, STORAGE_KEYS.secureLoginTimeout,
    ]));
    expect(vault.VAULT_KEYS).toEqual(expect.arrayContaining([
      ...vault.VAULT_SECRET_KEYS, STORAGE_KEYS.encryptionSalt, STORAGE_KEYS.defaultPasswordSecret,
    ]));
    expect(vault.isVaultKey(STORAGE_KEYS.preclaimedNames)).toBe(true);
    expect(vault.isVaultKey(STORAGE_KEYS.accountsRaw)).toBe(false);
  });

  it('migrates the complete legacy snapshot with one authoritative transaction write', async () => {
    const values = seedLegacy();
    const expected = await current();
    const put = vi.spyOn(IDBObjectStore.prototype, 'put');
    const committed = await vault.commitVault(expected, values);
    expect(committed.revision).toEqual(expect.any(String));
    expect(committed.values).toEqual(values);
    expect(put).toHaveBeenCalledTimes(1);
    expect(vault.VAULT_KEYS.some((key) => localStorage.getItem(rawKey(key)) !== null)).toBe(false);
    expect((await reload()).readVault()).toEqual(committed);
  });

  it('leaves the legacy wallet untouched when the first authoritative write fails', async () => {
    seedLegacy();
    const expected = await current();
    const before = stored();
    const fault = failWrites();
    await expect(vault.commitVault(expected, expected.values)).rejects.toThrow('Vault quota exceeded');
    expect(stored()).toEqual(before);
    expect(vault.readVault()).toEqual(expected);
    fault.mockRestore();
    expect((await reload()).readVault()).toEqual(expected);
  });

  it('preserves the old generation after a replacement failure and restart', async () => {
    const initial = await current();
    const expected = await vault.commitVault(initial, initial.values);
    const fault = failWrites();
    await expect(vault.commitVault(expected, {
      ...expected.values, [STORAGE_KEYS.mnemonic]: 'new-mnemonic', [STORAGE_KEYS.encryptionSalt]: 'new-salt',
    })).rejects.toThrow('Vault quota exceeded');
    expect(vault.readVault()).toEqual(expected);
    fault.mockRestore();
    expect((await reload()).readVault()).toEqual(expected);
  });

  it('never announces a transaction that aborts after requesting its write', async () => {
    const initial = await current();
    const expected = await vault.commitVault(initial, initial.values);
    const changed = vi.fn();
    const unsubscribe = vault.subscribeVault(changed);
    const realPut = IDBObjectStore.prototype.put;
    const fault = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function abortPut(...args) {
      const request = realPut.apply(this, args);
      this.transaction.abort();
      return request;
    });
    await expect(vault.commitVault(expected, { ...expected.values, [STORAGE_KEYS.mnemonic]: 'uncommitted' })).rejects.toThrow();
    expect(changed).not.toHaveBeenCalled();
    expect(vault.readVault()).toEqual(expected);
    fault.mockRestore();
    expect((await reload()).readVault()).toEqual(expected);
    unsubscribe();
  });

  it('keeps the committed wallet readable after partial cleanup and retries on reopen', async () => {
    seedLegacy();
    const expected = await current();
    const remove = Storage.prototype.removeItem;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fault = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function removeItem(key) {
      if (key === rawKey(STORAGE_KEYS.mnemonic)) throw new Error('Cleanup unavailable');
      return remove.call(this, key);
    });
    const committed = await vault.commitVault(expected, expected.values);
    expect(vault.readVault()).toEqual(committed);
    expect((await reload()).readVault()).toEqual(committed);
    expect(localStorage.getItem(rawKey(STORAGE_KEYS.mnemonic))).not.toBeNull();
    expect(localStorage.getItem(rawKey(STORAGE_KEYS.encryptionSalt))).toBeNull();
    fault.mockRestore();
    expect((await reload()).readVault()).toEqual(committed);
    expect(localStorage.getItem(rawKey(STORAGE_KEYS.mnemonic))).toBeNull();
  });

  it('removes a skipped-password copy on reopen after migrating to a real password', async () => {
    const crypto = await import('@/utils/crypto');
    const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const imports = '["imported-private-key"]';
    const oldSalt = crypto.generateSalt();
    const oldPassword = crypto.encodeBase64(globalThis.crypto.getRandomValues(new Uint8Array(32)));
    const oldKey = await crypto.generateEncryptionKey(oldPassword, oldSalt);
    const legacy = {
      ...vault.readVault().values,
      [STORAGE_KEYS.mnemonic]: await crypto.encrypt(oldKey, mnemonic),
      [STORAGE_KEYS.privateKeyAccountsRaw]: await crypto.encrypt(oldKey, imports),
      [STORAGE_KEYS.encryptionSalt]: crypto.encodeBase64(oldSalt),
      [STORAGE_KEYS.defaultPasswordSecret]: oldPassword,
    };
    Object.entries(legacy).forEach(([key, value]) => {
      if (value !== null) localStorage.setItem(rawKey(key), JSON.stringify(value));
    });
    const expected = await current();
    const newSalt = crypto.generateSalt();
    const newPassword = 'a-user-chosen-password';
    const newKey = await crypto.generateEncryptionKey(newPassword, newSalt);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fault = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Cleanup interrupted');
    });
    const committed = await vault.commitVault(expected, {
      ...expected.values,
      [STORAGE_KEYS.mnemonic]: await crypto.encrypt(newKey, mnemonic),
      [STORAGE_KEYS.privateKeyAccountsRaw]: await crypto.encrypt(newKey, imports),
      [STORAGE_KEYS.encryptionSalt]: crypto.encodeBase64(newSalt),
      [STORAGE_KEYS.defaultPasswordSecret]: null,
    });
    Object.entries(legacy).forEach(([key, value]) => {
      expect(localStorage.getItem(rawKey(key))).toBe(value === null ? null : JSON.stringify(value));
    });
    fault.mockRestore();

    const put = vi.spyOn(IDBObjectStore.prototype, 'put');
    const reopened = (await reload()).readVault();
    expect(reopened).toEqual(committed);
    expect(put).not.toHaveBeenCalled();
    expect(vault.VAULT_KEYS.every((key) => localStorage.getItem(rawKey(key)) === null)).toBe(true);
    const reopenedSalt = crypto.decodeBase64(reopened.values[STORAGE_KEYS.encryptionSalt]);
    const reopenedKey = await crypto.generateEncryptionKey(newPassword, reopenedSalt);
    const reopenedMnemonic = reopened.values[STORAGE_KEYS.mnemonic];
    const reopenedImports = reopened.values[STORAGE_KEYS.privateKeyAccountsRaw];
    expect(await crypto.decrypt(reopenedKey, reopenedMnemonic)).toBe(mnemonic);
    expect(await crypto.decrypt(reopenedKey, reopenedImports)).toBe(imports);
    await expect(crypto.decrypt(oldKey, reopenedMnemonic)).rejects.toThrow();
  });

  it('preserves all legacy entries if cleanup cannot read every field', async () => {
    seedLegacy();
    const expected = await current();
    const committed = await vault.commitVault(expected, expected.values);
    seedLegacy(); // Copies left behind by an interrupted cleanup.
    const before = stored();
    const get = Storage.prototype.getItem;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fault = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function getItem(key) {
      if (key === rawKey(STORAGE_KEYS.defaultPasswordSecret)) throw new Error('Storage unavailable');
      return get.call(this, key);
    });
    const remove = vi.spyOn(Storage.prototype, 'removeItem');
    const reopened = await reload();
    expect(reopened.readVault()).toEqual(committed);
    expect(remove).not.toHaveBeenCalled();
    fault.mockRestore();
    expect(stored()).toEqual(before);
    await reopened.refreshVault();
    expect(vault.VAULT_KEYS.every((key) => localStorage.getItem(rawKey(key)) === null)).toBe(true);
  });

  it('preserves legacy entries when authority has no cleanup provenance', async () => {
    const values = seedLegacy();
    await current();
    const record = { version: 1, revision: 'without-provenance', values };
    await corruptAuthority(record);
    const before = stored();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect((await reload()).readVault()).toEqual({ revision: record.revision, values });
    expect(stored()).toEqual(before);
  });

  it('preserves committed data when a cross-window notification cannot be written', async () => {
    const expected = await current();
    const set = Storage.prototype.setItem;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function setItem(key, value) {
      if (key === vault.VAULT_STORAGE_KEY) throw new Error('Notification unavailable');
      return set.call(this, key, value);
    });
    const committed = await vault.commitVault(expected, { ...expected.values, [STORAGE_KEYS.mnemonic]: 'committed' });
    expect(vault.readVault()).toEqual(committed);
    expect((await reload()).readVault()).toEqual(committed);
  });

  it('rejects invalid authority instead of falling back to legacy data', async () => {
    seedLegacy();
    await current();
    await corruptAuthority({ version: 999 });
    const before = stored();
    await expect(reload()).rejects.toThrow();
    expect(stored()).toEqual(before);
  });

  it('rejects malformed authoritative ciphertext without repairing it to a default', async () => {
    const expected = await current();
    await corruptAuthority({
      version: 1, revision: 'malformed', values: { ...expected.values, [STORAGE_KEYS.privateKeyAccountsRaw]: ['invalid'] },
    });
    await expect(vault.refreshVault()).rejects.toThrow();
    await expect(reload()).rejects.toThrow();
  });

  it('rejects a prepared snapshot superseded by another mutation', async () => {
    const stale = await current();
    await vault.writeVaultField(STORAGE_KEYS.secureLoginTimeout, 'updated');
    const expected = vault.readVault();
    await expect(vault.commitVault(stale, { ...stale.values, [STORAGE_KEYS.encryptionSalt]: 'stale' })).rejects.toThrow();
    expect(vault.readVault()).toEqual(expected);
  });

  it('lets only one of two independent windows commit an identical prepared revision', async () => {
    const expected = await current();
    const otherWindow = await reload();
    const results = await Promise.allSettled([
      vault.commitVault(expected, { ...expected.values, [STORAGE_KEYS.encryptionSalt]: 'first' }),
      otherWindow.commitVault(expected, { ...expected.values, [STORAGE_KEYS.encryptionSalt]: 'second' }),
    ]);
    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(1);
    await vault.refreshVault();
    expect(vault.readVault().values[STORAGE_KEYS.encryptionSalt]).toBe('first');
  });

  it('checks the caller guard before publishing or changing persisted data', async () => {
    const expected = await current();
    const changed = vi.fn();
    const unsubscribe = vault.subscribeVault(changed);
    await expect(vault.commitVault(expected, expected.values, () => { throw new Error('Wallet locked'); })).rejects.toThrow('Wallet locked');
    expect(vault.readVault()).toEqual(expected);
    expect(changed).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('publishes all replacement fields together after transaction completion', async () => {
    const expected = await current();
    const snapshots = [];
    const unsubscribe = vault.subscribeVault(() => snapshots.push(vault.readVault()));
    const committed = await vault.commitVault(expected, {
      ...expected.values,
      [STORAGE_KEYS.encryptionSalt]: 'salt',
      [STORAGE_KEYS.mnemonic]: 'mnemonic',
      [STORAGE_KEYS.privateKeyAccountsRaw]: 'imports',
    });
    expect(snapshots).toEqual([committed]);
    expect((await reload()).readVault()).toEqual(committed);
    unsubscribe();
  });

  it('retains all legacy credentials when an old window adds a divergent import', async () => {
    seedLegacy();
    const expected = await current();
    const committed = await vault.commitVault(expected, expected.values);
    seedLegacy(); // The old version still has the pre-migration copies.
    localStorage.setItem(rawKey(STORAGE_KEYS.privateKeyAccountsRaw), JSON.stringify('late-legacy-import'));
    const before = stored();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(vault.readVault()).toEqual(committed);
    // Ordinary saving keeps working, the vault stays authoritative.
    await vault.writeVaultField(STORAGE_KEYS.mnemonic, 'replacement');
    expect(vault.readVault().values[STORAGE_KEYS.mnemonic]).toBe('replacement');
    const legacyOnly = () => Object.fromEntries(Object.entries(stored())
      .filter(([key]) => key !== vault.VAULT_STORAGE_KEY));
    const legacyBefore = Object.fromEntries(Object.entries(before)
      .filter(([key]) => key !== vault.VAULT_STORAGE_KEY));
    expect(legacyOnly()).toEqual(legacyBefore);
    expect((await reload()).readVault().values[STORAGE_KEYS.mnemonic]).toBe('replacement');
    expect(legacyOnly()).toEqual(legacyBefore);
  });

  it('blocks a new password over divergent legacy copies until they are explicitly discarded', async () => {
    seedLegacy();
    const expected = await current();
    await vault.commitVault(expected, expected.values);
    seedLegacy();
    localStorage.setItem(rawKey(STORAGE_KEYS.privateKeyAccountsRaw), JSON.stringify('late-legacy-import'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rotate = () => {
      const latest = vault.readVault();
      return vault.commitVault(latest, {
        ...latest.values, [STORAGE_KEYS.encryptionSalt]: 'new-salt',
      }, undefined, { requireLegacyReconciled: true });
    };
    const before = vault.readVault();
    const refused = await rotate().catch((error) => error);
    expect(refused).toBeInstanceOf(vault.VaultLegacyConflictError);
    expect(refused.expected.vault).toEqual(before);
    expect(vault.readVault()).toEqual(before);
    expect(localStorage.getItem(rawKey(STORAGE_KEYS.privateKeyAccountsRaw))).not.toBeNull();

    // A decision made on an outdated vault isn't applied.
    await vault.writeVaultField(STORAGE_KEYS.secureLoginTimeout, 'changed');
    await expect(vault.discardLegacyCopies(refused.expected))
      .rejects.toThrow(vault.VaultConflictError);
    expect(localStorage.getItem(rawKey(STORAGE_KEYS.privateKeyAccountsRaw))).not.toBeNull();

    // Nor one on copies the older version changed while the user decided.
    const shown = (await rotate().catch((error) => error)).expected;
    localStorage.setItem(rawKey(STORAGE_KEYS.invitesEncrypted), JSON.stringify('invite-added-meanwhile'));
    const changedCopies = stored();
    await expect(vault.discardLegacyCopies(shown)).rejects.toThrow(vault.VaultConflictError);
    expect(stored()).toEqual(changedCopies);

    await vault.discardLegacyCopies((await rotate().catch((error) => error)).expected);
    expect(vault.VAULT_KEYS.every((key) => localStorage.getItem(rawKey(key)) === null)).toBe(true);
    expect((await rotate()).values[STORAGE_KEYS.encryptionSalt]).toBe('new-salt');
  });

  it('requests strict durability for every commit and reset', async () => {
    const transaction = vi.spyOn(IDBDatabase.prototype, 'transaction');
    const expected = await current();
    await vault.commitVault(expected, { ...expected.values, [STORAGE_KEYS.mnemonic]: 'mnemonic' });
    await vault.clearVault();
    const writes = transaction.mock.calls.filter(([, mode]) => mode === 'readwrite');
    expect(writes).toHaveLength(2);
    writes.forEach(([, , options]) => expect(options).toEqual({ durability: 'strict' }));
  });

  it('opens the storage again after the browser closed it', async () => {
    const expected = await current();
    const transaction = vi.spyOn(IDBDatabase.prototype, 'transaction');
    await vault.refreshVault();
    const [db] = transaction.mock.contexts;
    db.close();
    db.onclose?.(); // As the browser does, e.g. once its data was cleared.

    const committed = await vault.commitVault(expected, { ...expected.values, [STORAGE_KEYS.mnemonic]: 'after-close' });

    expect((await reload()).readVault()).toEqual(committed);
  });

  it('lets wallet secrets change only through the vault once it exists', async () => {
    const { WalletStorage } = await import('@/lib/WalletStorage');
    const expected = await current();
    await vault.commitVault(expected, { ...expected.values, [STORAGE_KEYS.mnemonic]: 'mnemonic' });

    expect(() => WalletStorage.set(STORAGE_KEYS.mnemonic, 'other')).toThrow('through the vault');
    expect(() => WalletStorage.remove(STORAGE_KEYS.mnemonic)).toThrow('through the vault');
    WalletStorage.set(STORAGE_KEYS.mnemonic, 'mnemonic'); // Already stored, nothing to do.
    expect(WalletStorage.get(STORAGE_KEYS.mnemonic)).toBe('mnemonic');
    expect(localStorage.getItem(rawKey(STORAGE_KEYS.mnemonic))).toBeNull();
  });

  /** E.g. Firefox before 126: a completed commit may not be on the disk yet. */
  function withoutDurability() {
    const realTransaction = IDBDatabase.prototype.transaction;
    return vi.spyOn(IDBDatabase.prototype, 'transaction')
      .mockImplementation(function transaction(...args) {
        const result = realTransaction.apply(this, args);
        Object.defineProperty(result, 'durability', { value: undefined });
        return result;
      });
  }

  describe('a new password where the browser cannot store the vault durably', () => {
    const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const IMPORTS = '["imported-private-key"]';
    const PASSWORD = 'a-user-chosen-password';

    /** A skipped password's wallet as an older version stored it, then a real password. */
    async function changeSkippedPassword({ afterSeeding = () => {} } = {}) {
      const crypto = await import('@/utils/crypto');
      const skipped = crypto.encodeBase64(globalThis.crypto.getRandomValues(new Uint8Array(32)));
      const oldSalt = crypto.generateSalt();
      const legacyKey = await crypto.generateEncryptionKey(skipped, oldSalt);
      const legacy = {
        [STORAGE_KEYS.mnemonic]: await crypto.encrypt(legacyKey, MNEMONIC),
        [STORAGE_KEYS.privateKeyAccountsRaw]: await crypto.encrypt(legacyKey, IMPORTS),
        [STORAGE_KEYS.encryptionSalt]: crypto.encodeBase64(oldSalt),
        [STORAGE_KEYS.defaultPasswordSecret]: skipped,
      };
      Object.entries(legacy).forEach(([key, value]) => {
        localStorage.setItem(rawKey(key), JSON.stringify(value));
      });
      afterSeeding();
      const expected = await current();
      const newSalt = crypto.generateSalt();
      const newKey = await crypto.generateEncryptionKey(PASSWORD, newSalt);
      const committed = await vault.commitVault(expected, {
        ...expected.values,
        [STORAGE_KEYS.mnemonic]: await crypto.encrypt(newKey, MNEMONIC),
        [STORAGE_KEYS.privateKeyAccountsRaw]: await crypto.encrypt(newKey, IMPORTS),
        [STORAGE_KEYS.preclaimedNames]: await crypto.encrypt(newKey, '{}'),
        [STORAGE_KEYS.encryptionSalt]: crypto.encodeBase64(newSalt),
        [STORAGE_KEYS.defaultPasswordSecret]: null,
      }, undefined, { requireLegacyReconciled: true });
      return { committed };
    }

    async function expectOpensWithPassword(values) {
      const crypto = await import('@/utils/crypto');
      const key = await crypto.generateEncryptionKey(
        PASSWORD,
        crypto.decodeBase64(values[STORAGE_KEYS.encryptionSalt]),
      );
      expect(await crypto.decrypt(key, values[STORAGE_KEYS.mnemonic])).toBe(MNEMONIC);
      expect(await crypto.decrypt(key, values[STORAGE_KEYS.privateKeyAccountsRaw])).toBe(IMPORTS);
    }

    it('replaces the copies, so none opens with the skipped password', async () => {
      const durability = withoutDurability();
      const { committed } = await changeSkippedPassword();

      expect(localStorage.getItem(rawKey(STORAGE_KEYS.defaultPasswordSecret))).toBeNull();
      [
        STORAGE_KEYS.mnemonic, STORAGE_KEYS.privateKeyAccountsRaw, STORAGE_KEYS.encryptionSalt,
      ].forEach((key) => expect(localStorage.getItem(rawKey(key)))
        .toBe(JSON.stringify(committed.values[key])));
      // A slot that had no copy gets none: a fresh install stays without them.
      expect(localStorage.getItem(rawKey(STORAGE_KEYS.preclaimedNames))).toBeNull();

      durability.mockRestore(); // e.g. after a browser update
      expect((await reload()).readVault()).toEqual(committed);
      expect(vault.VAULT_KEYS.every((key) => localStorage.getItem(rawKey(key)) === null))
        .toBe(true);
    });

    it('falls back to copies that open with the new password when the commit was lost', async () => {
      withoutDurability();
      await changeSkippedPassword();

      // As after a power loss before the browser saved the vault.
      globalThis.indexedDB = new IDBFactory();
      const fallback = (await reload()).readVault();

      expect(fallback.revision).toBeNull();
      expect(fallback.values[STORAGE_KEYS.defaultPasswordSecret]).toBeNull();
      await expectOpensWithPassword(fallback.values);
    });

    it('removes every copy when one of them cannot be replaced', async () => {
      withoutDurability();
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { setItem } = Storage.prototype;
      const failImportsCopy = () => vi.spyOn(Storage.prototype, 'setItem')
        .mockImplementation(function failing(key, value) {
          if (key === rawKey(STORAGE_KEYS.privateKeyAccountsRaw)) throw new Error('Quota exceeded');
          return setItem.call(this, key, value);
        });

      const { committed } = await changeSkippedPassword({ afterSeeding: failImportsCopy });

      expect(vault.VAULT_KEYS.every((key) => localStorage.getItem(rawKey(key)) === null))
        .toBe(true);
      expect((await reload()).readVault()).toEqual(committed);
    });
  });

  it('keeps the legacy copies where the browser cannot store the vault durably', async () => {
    const durability = withoutDurability();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    seedLegacy();
    const expected = await current();
    const before = stored();
    const committed = await vault.commitVault(expected, expected.values);
    const legacyKeys = () => vault.VAULT_KEYS
      .filter((key) => localStorage.getItem(rawKey(key)) !== null);
    const seeded = legacyKeys();
    expect(seeded.length).toBeGreaterThan(0);
    expect((await reload()).readVault()).toEqual(committed);
    expect(legacyKeys()).toEqual(seeded);
    seeded.forEach((key) => expect(localStorage.getItem(rawKey(key))).toBe(before[rawKey(key)]));

    durability.mockRestore(); // e.g. after a browser update
    expect((await reload()).readVault()).toEqual(committed);
    expect(legacyKeys()).toEqual([]);
  });

  it('reports unavailable storage without falling back to the legacy copies', async () => {
    seedLegacy();
    const expected = await current();
    await vault.commitVault(expected, { ...expected.values, [STORAGE_KEYS.mnemonic]: 'authoritative' });
    seedLegacy(); // Copies an older version wrote back.
    const before = stored();
    const open = vi.spyOn(indexedDB, 'open').mockImplementation(() => {
      throw new DOMException('Storage disabled', 'SecurityError');
    });
    vi.resetModules();
    const restarted = await import('@/lib/WalletVault');
    const error = await restarted.ensureVaultReady().catch((e) => e);
    expect(error).toBeInstanceOf(restarted.VaultUnavailableError);
    expect(() => restarted.readVault()).toThrow(restarted.VaultUnavailableError);
    expect(stored()).toEqual(before);
    open.mockRestore();
    await restarted.ensureVaultReady(); // A retry once it is available again
    expect(restarted.readVault().values[STORAGE_KEYS.mnemonic]).toBe('authoritative');
  });

  it('does not clean legacy data from a refresh superseded by a reset', async () => {
    seedLegacy();
    const expected = await current();
    await vault.commitVault(expected, expected.values);
    const entered = deferred();
    let finishRefresh;
    const realGet = IDBObjectStore.prototype.get;
    const get = vi.spyOn(IDBObjectStore.prototype, 'get').mockImplementation(function pauseGet(...args) {
      const request = realGet.apply(this, args);
      const { transaction } = this;
      transaction.addEventListener('complete', (event) => {
        event.stopImmediatePropagation();
        finishRefresh = () => transaction.oncomplete(event);
        entered.resolve();
      }, { once: true });
      return request;
    });
    const refreshing = vault.refreshVault();
    await entered.promise;
    get.mockRestore();
    try {
      await vault.clearVault();
      const cleared = vault.readVault();
      seedLegacy();
      const before = stored();
      const remove = vi.spyOn(Storage.prototype, 'removeItem');
      finishRefresh();
      await refreshing;
      expect(vault.readVault()).toEqual(cleared);
      expect(stored()).toEqual(before);
      expect(remove).not.toHaveBeenCalled();
    } finally {
      finishRefresh();
      await refreshing;
    }
  });

  it('refreshes a different window from authority after its notification', async () => {
    await current();
    const otherWindow = await reload();
    const expected = otherWindow.readVault();
    const committed = await otherWindow.commitVault(expected, { ...expected.values, [STORAGE_KEYS.mnemonic]: 'external' });
    const received = [];
    const unsubscribe = vault.subscribeVault((snapshot) => received.push(snapshot));
    window.dispatchEvent(new StorageEvent('storage', { key: vault.VAULT_STORAGE_KEY, newValue: JSON.stringify(committed.revision) }));
    await vi.waitFor(() => expect(received).toContainEqual(committed));
    expect(vault.readVault()).toEqual(committed);
    unsubscribe();
  });

  it('refreshes once another window cleared the whole storage', async () => {
    await current();
    const otherWindow = await reload();
    const expected = otherWindow.readVault();
    const committed = await otherWindow.commitVault(expected, { ...expected.values, [STORAGE_KEYS.mnemonic]: 'external' });
    const received = [];
    const unsubscribe = vault.subscribeVault((snapshot) => received.push(snapshot));
    // `localStorage.clear()`, as a reset does: its notification names no key.
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    await vi.waitFor(() => expect(received).toContainEqual(committed));
    unsubscribe();
  });

  it('preserves unreadable imported ciphertext and never calls its default-producing update', async () => {
    await current();
    const { encrypt, generateEncryptionKey, generateSalt } = await import('@/utils/crypto');
    const key = await generateEncryptionKey('password', generateSalt());
    const wrongKey = await generateEncryptionKey('wrong', generateSalt());
    await vault.writeVaultField(STORAGE_KEYS.privateKeyAccountsRaw, await encrypt(key, '["import"]'));
    const before = vault.readVault();
    const update = vi.fn(() => '[]');
    await expect(vault.updateVaultSecret(STORAGE_KEYS.privateKeyAccountsRaw, wrongKey, update))
      .rejects.toThrow();
    expect(update).not.toHaveBeenCalled();
    expect(vault.readVault()).toEqual(before);
  });

  it('names the unreadable secret, and replaces it only when asked to without reading it', async () => {
    await current();
    const {
      decrypt, encrypt, generateEncryptionKey, generateSalt,
    } = await import('@/utils/crypto');
    const key = await generateEncryptionKey('password', generateSalt());
    const wrongKey = await generateEncryptionKey('wrong', generateSalt());
    await vault.writeVaultField(STORAGE_KEYS.secureLoginTimeout, await encrypt(wrongKey, '60000'));
    const before = vault.readVault();
    const error = await vault.updateVaultSecret(STORAGE_KEYS.secureLoginTimeout, key, () => '0')
      .catch((e) => e);
    expect(error).toBeInstanceOf(vault.VaultSecretUnreadableError);
    expect(error.storageKey).toBe(STORAGE_KEYS.secureLoginTimeout);
    expect(error.vault).toEqual(before);
    expect(vault.readVault()).toEqual(before);

    const update = vi.fn(() => '0');
    const ciphertext = await vault.updateVaultSecret(
      STORAGE_KEYS.secureLoginTimeout,
      key,
      update,
      undefined,
      { replace: true },
    );
    expect(update).toHaveBeenCalledWith(null);
    expect(await decrypt(key, ciphertext)).toBe('0');
  });

  it('propagates encryption failure without modifying persisted data', async () => {
    await current();
    const { encrypt, generateEncryptionKey, generateSalt } = await import('@/utils/crypto');
    const key = await generateEncryptionKey('password', generateSalt());
    await vault.writeVaultField(STORAGE_KEYS.privateKeyAccountsRaw, await encrypt(key, '["original"]'));
    const before = vault.readVault();
    vi.spyOn(globalThis.crypto.subtle, 'encrypt').mockRejectedValueOnce(new Error('Encryption failed'));
    await expect(vault.updateVaultSecret(STORAGE_KEYS.privateKeyAccountsRaw, key, () => '["new"]')).rejects.toThrow('Encryption failed');
    expect(vault.readVault()).toEqual(before);
  });

  it('keeps both concurrent imports by retrying against the latest plaintext', async () => {
    await current();
    const { decrypt, generateEncryptionKey, generateSalt } = await import('@/utils/crypto');
    const key = await generateEncryptionKey('password', generateSalt());
    await Promise.all(['first', 'second'].map((account) => vault.updateVaultSecret(
      STORAGE_KEYS.privateKeyAccountsRaw,
      key,
      (plaintext) => JSON.stringify([...JSON.parse(plaintext || '[]'), account]),
    )));
    const ciphertext = vault.readVault().values[STORAGE_KEYS.privateKeyAccountsRaw];
    expect(JSON.parse(await decrypt(key, ciphertext)).sort()).toEqual(['first', 'second']);
  });

  it('rejects an old key even for a previously empty slot after another window rotated', async () => {
    const expected = await current();
    const { encrypt, generateEncryptionKey, generateSalt } = await import('@/utils/crypto');
    const oldKey = await generateEncryptionKey('old', generateSalt());
    const newKey = await generateEncryptionKey('new', generateSalt());
    await vault.commitVault(expected, {
      ...expected.values, [STORAGE_KEYS.mnemonic]: await encrypt(newKey, 'new-mnemonic'), [STORAGE_KEYS.encryptionSalt]: 'new-salt',
    });
    const before = vault.readVault();
    await expect(vault.updateVaultSecret(STORAGE_KEYS.privateKeyAccountsRaw, oldKey, () => '["stale"]')).rejects.toThrow();
    expect(vault.readVault()).toEqual(before);
  });

  it('prevents a pending old-key write from overwriting a completed rotation', async () => {
    await current();
    const crypto = await import('@/utils/crypto');
    const oldKey = await crypto.generateEncryptionKey('old', crypto.generateSalt());
    const newKey = await crypto.generateEncryptionKey('new', crypto.generateSalt());
    const plaintext = '["original"]';
    const ciphertext = await crypto.encrypt(oldKey, plaintext);
    await vault.writeVaultField(STORAGE_KEYS.privateKeyAccountsRaw, ciphertext);
    const gate = deferred();
    const entered = deferred();
    const encrypt = globalThis.crypto.subtle.encrypt.bind(globalThis.crypto.subtle);
    vi.spyOn(globalThis.crypto.subtle, 'encrypt').mockImplementation(async (...args) => {
      if (args[1] === oldKey) { entered.resolve(); await gate.promise; }
      return encrypt(...args);
    });
    const pending = vault.updateVaultSecret(STORAGE_KEYS.privateKeyAccountsRaw, oldKey, () => '["late"]');
    const settled = pending.then(() => ({ ok: true }), (error) => ({ error }));
    await entered.promise;
    try {
      const expected = vault.readVault();
      const replacement = await crypto.encrypt(newKey, plaintext);
      await vault.commitVault(expected, { ...expected.values, [STORAGE_KEYS.privateKeyAccountsRaw]: replacement, [STORAGE_KEYS.encryptionSalt]: 'new-salt' });
      gate.resolve();
      expect(await settled).toEqual({ error: expect.any(Error) });
      expect(vault.readVault().values[STORAGE_KEYS.privateKeyAccountsRaw]).toBe(replacement);
    } finally { gate.resolve(); await settled; }
  });

  it('clears authoritative and legacy state so restarting cannot restore a deleted wallet', async () => {
    seedLegacy();
    const expected = await current();
    await vault.commitVault(expected, expected.values);
    seedLegacy(); // Copies an older version wrote back.
    await vault.clearVault();
    expect(Object.values(vault.readVault().values).every((value) => value === null)).toBe(true);
    const restarted = await reload();
    expect(Object.values(restarted.readVault().values).every((value) => value === null)).toBe(true);
    expect(vault.VAULT_KEYS.some((key) => localStorage.getItem(rawKey(key)) !== null)).toBe(false);
  });

  it('refuses a write with a key from before a reset, also after other commits', async () => {
    const crypto = await import('@/utils/crypto');
    const oldKey = await crypto.generateEncryptionKey('old-password', crypto.generateSalt());
    const wallet = await current();
    await vault.commitVault(wallet, {
      ...wallet.values,
      [STORAGE_KEYS.encryptionSalt]: 'old-salt',
      [STORAGE_KEYS.mnemonic]: await crypto.encrypt(oldKey, 'seed'),
    });
    await vault.clearVault();
    // Not a new wallet, which would store a seed: the reset still fences off older writers.
    const reset = vault.readVault();
    await vault.commitVault(reset, { ...reset.values, [STORAGE_KEYS.secureLoginTimeout]: 'x' });
    const before = vault.readVault();

    // E.g. a locked window storing a sent preclaim's salt with the key it took before.
    await expect(vault.updateVaultSecret(STORAGE_KEYS.preclaimedNames, oldKey, () => '{"a":1}'))
      .rejects.toThrow(vault.VaultResetError);
    expect(vault.readVault()).toEqual(before);
  });

  it('does not use password vaults on native mobile', async () => {
    vi.resetModules();
    vi.doMock('@/constants', async () => ({ ...await vi.importActual('@/constants'), IS_MOBILE_APP: true }));
    const mobile = await import('@/lib/WalletVault');
    const initial = mobile.readVault();
    expect(mobile.VAULT_KEYS.some((key) => mobile.isVaultKey(key))).toBe(false);
    await expect(mobile.commitVault(initial, initial.values)).rejects.toThrow();
    expect(localStorage.getItem(mobile.VAULT_STORAGE_KEY)).toBeNull();
  });
});
