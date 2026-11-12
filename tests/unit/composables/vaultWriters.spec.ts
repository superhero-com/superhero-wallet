// @ts-nocheck
const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

function importedAccount(byte: string) {
  return {
    type: 'private-key',
    isRestored: false,
    protocol: 'ethereum',
    privateKey: Buffer.from(byte.repeat(32), 'hex'),
  };
}

describe('vault encrypted writers', () => {
  let encryptionKey;
  let modules;
  let keyIsCurrent;
  let openConfirmModal;

  beforeEach(async () => {
    vi.resetModules();
    vi.restoreAllMocks();
    localStorage.clear();
    const { ref } = await import('vue');
    const { mnemonicToSeedSync } = await import('@scure/bip39');
    encryptionKey = ref();
    keyIsCurrent = true;
    openConfirmModal = vi.fn().mockRejectedValue(new Error('No modal'));
    vi.doMock('@/constants', async (importOriginal) => ({
      ...await importOriginal(),
      IS_MOBILE_APP: false,
      IS_EXTENSION: false,
      IS_OFFSCREEN_TAB: false,
    }));
    vi.doMock('@/composables/auth', () => ({
      useAuth: () => ({
        mnemonic: ref(MNEMONIC),
        mnemonicSeed: ref(mnemonicToSeedSync(MNEMONIC)),
        isMnemonicRestored: ref(true),
        isAuthenticated: ref(true),
        isMnemonicUnreadable: ref(false),
        encryptionKey,
        isEncryptionKeyCurrent: () => keyIsCurrent,
      }),
    }));
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openModal: vi.fn().mockRejectedValue(new Error('No modal')),
        openConfirmModal,
      }),
    }));
    vi.doMock('@/lib/logger', () => ({ default: { write: vi.fn() } }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await import('@/protocols/registerAdapters');
    modules = {
      ...await import('@/lib/WalletVault'),
      ...await import('@/lib/WalletStorage'),
      ...await import('@/constants'),
      ...await import('@/utils/crypto'),
      ...await import('@/utils/common'),
      ...await import('@/composables/storageRef'),
      ...await import('@/composables/accounts'),
    };
    const salt = modules.generateSalt();
    encryptionKey.value = await modules.generateEncryptionKey('old-password', salt);
    const { WalletStorage, STORAGE_KEYS } = modules;
    WalletStorage.set(STORAGE_KEYS.encryptionSalt, modules.encodeBase64(salt));
    WalletStorage.set(STORAGE_KEYS.mnemonic, await modules.encrypt(encryptionKey.value, MNEMONIC));
    WalletStorage.set(STORAGE_KEYS.privateKeyAccountsRaw, await modules.encrypt(encryptionKey.value, '[]'));
    WalletStorage.set(STORAGE_KEYS.accountsRaw, [{
      type: 'hd-wallet', protocol: 'aeternity', isRestored: true,
    }]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function bootAccounts() {
    const accounts = modules.useAccounts();
    await modules.watchUntilTruthy(accounts.areAccountsReady);
    return accounts;
  }

  function pauseEncryption(predicate: (plaintext: string) => boolean) {
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    let markEntered;
    const entered = new Promise((resolve) => { markEntered = resolve; });
    const realEncrypt = globalThis.crypto.subtle.encrypt.bind(globalThis.crypto.subtle);
    vi.spyOn(globalThis.crypto.subtle, 'encrypt').mockImplementation(async (algorithm, key, bytes) => {
      if (predicate(new TextDecoder().decode(bytes))) {
        markEntered();
        await gate;
      }
      return realEncrypt(algorithm, key, bytes);
    });
    return { entered, release };
  }

  it('persists both concurrent imports and returns their own account indexes', async () => {
    const accounts = await bootAccounts();
    const indexes = await Promise.all([
      accounts.addPrivateKeyAccount(importedAccount('aa')),
      accounts.addPrivateKeyAccount(importedAccount('bb')),
    ]);
    expect(indexes.sort()).toEqual([1, 2]);
    const ciphertext = modules.readVault().values[modules.STORAGE_KEYS.privateKeyAccountsRaw];
    const stored = JSON.parse(await modules.decrypt(encryptionKey.value, ciphertext));
    expect(stored).toHaveLength(2);
    expect(stored.map(({ privateKey }) => Buffer.from(privateKey.data).toString('hex')).sort())
      .toEqual(['aa'.repeat(32), 'bb'.repeat(32)]);
  });

  it('stores an import submitted twice at once only once', async () => {
    const accounts = await bootAccounts();
    const indexes = await Promise.all([
      accounts.addPrivateKeyAccount(importedAccount('aa')),
      accounts.addPrivateKeyAccount(importedAccount('aa')),
    ]);
    expect(indexes).toEqual([1, 1]);
    const ciphertext = modules.readVault().values[modules.STORAGE_KEYS.privateKeyAccountsRaw];
    expect(JSON.parse(await modules.decrypt(encryptionKey.value, ciphertext))).toHaveLength(1);
    expect(accounts.accounts.value).toHaveLength(2);
  });

  it('rejects an import when persistence fails without changing the imported accounts', async () => {
    const accounts = await bootAccounts();
    const previous = modules.readVault();
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
      throw new Error('Vault storage full');
    });

    await expect(accounts.addPrivateKeyAccount(importedAccount('aa')))
      .rejects.toThrow('Vault storage full');
    expect(modules.readVault()).toEqual(previous);
    expect(accounts.accounts.value).toHaveLength(1);
  });

  it('resolves an explicit set only after the ciphertext is committed', async () => {
    let state;
    await new Promise((resolve) => {
      state = modules.useStorageRef(null, modules.STORAGE_KEYS.secureLoginTimeout, {
        onRestored: resolve,
      });
    });
    const timeout = modules.decryptedComputed(encryptionKey, state, '0');
    const paused = pauseEncryption((plaintext) => plaintext === '900000');
    let settled = false;
    const write = timeout.set('900000').then(() => { settled = true; });
    await paused.entered;
    try {
      expect(settled).toBe(false);
      expect(modules.readVault().values[modules.STORAGE_KEYS.secureLoginTimeout]).toBeNull();
    } finally {
      paused.release();
    }
    await write;
    const ciphertext = modules.readVault().values[modules.STORAGE_KEYS.secureLoginTimeout];
    expect(await modules.decrypt(encryptionKey.value, ciphertext)).toBe('900000');
    // Published to the storage ref by the commit itself.
    expect(state.value).toBe(ciphertext);
    await vi.waitFor(() => expect(timeout.value).toBe('900000'));
  });

  it('keeps a migrated secret when an unrelated vault field changes during migration', async () => {
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    let markEntered;
    const entered = new Promise((resolve) => { markEntered = resolve; });
    let state;
    const restored = new Promise((resolve) => {
      state = modules.useStorageRef('', modules.STORAGE_KEYS.mnemonic, {
        migrations: [async () => {
          markEntered();
          await gate;
          return 'migrated-mnemonic';
        }],
        onRestored: resolve,
      });
    });
    await entered;
    await modules.refreshVault();
    const snapshot = modules.readVault();
    try {
      await modules.commitVault(snapshot, {
        ...snapshot.values,
        [modules.STORAGE_KEYS.secureLoginTimeout]: 'concurrent-timeout',
      });
    } finally {
      release();
    }
    await restored;

    expect(state.value).toBe('migrated-mnemonic');
    expect(modules.readVault().values[modules.STORAGE_KEYS.mnemonic]).toBe('migrated-mnemonic');
    expect(modules.readVault().values[modules.STORAGE_KEYS.secureLoginTimeout]).toBe('concurrent-timeout');
  });

  it('keeps a seed stored while it migrated the older one, rather than write over it', async () => {
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    let markEntered;
    const entered = new Promise((resolve) => { markEntered = resolve; });
    let state;
    const restored = new Promise((resolve) => {
      state = modules.useStorageRef('', modules.STORAGE_KEYS.mnemonic, {
        migrations: [async () => {
          markEntered();
          await gate;
          return 'migrated-mnemonic';
        }],
        onRestored: resolve,
      });
    });
    await entered;
    await modules.refreshVault();
    const snapshot = modules.readVault();
    try {
      await modules.commitVault(snapshot, {
        ...snapshot.values,
        [modules.STORAGE_KEYS.mnemonic]: 'stored-meanwhile',
      });
    } finally {
      release();
    }
    await restored;

    expect(state.value).toBe('stored-meanwhile');
    expect(modules.readVault().values[modules.STORAGE_KEYS.mnemonic]).toBe('stored-meanwhile');
  });

  it.each([
    // Published before the ref listens, so only the check after subscribing sees it.
    ['this window', async () => ({ vault: modules, notify: () => {} })],
    ['another window', async () => {
      vi.resetModules();
      const vault = await import('@/lib/WalletVault');
      await vault.ensureVaultReady();
      // Its commit's notification, which the committing window itself doesn't get.
      const notify = () => window.dispatchEvent(
        new StorageEvent('storage', { key: vault.VAULT_STORAGE_KEY }),
      );
      return { vault, notify };
    }],
  ])('ends with the seed %s stored while its own was being migrated', async (_, openVault) => {
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    let markEntered;
    const entered = new Promise((resolve) => { markEntered = resolve; });
    let state;
    const restored = new Promise((resolve) => {
      state = modules.useStorageRef('', modules.STORAGE_KEYS.mnemonic, {
        migrations: [async (value) => {
          markEntered();
          await gate;
          return value; // Nothing to migrate, so nothing is written.
        }],
        onRestored: resolve,
      });
    });
    await entered;
    const { vault, notify } = await openVault();
    const snapshot = vault.readVault();
    try {
      await vault.commitVault(snapshot, {
        ...snapshot.values,
        [modules.STORAGE_KEYS.mnemonic]: 'stored-meanwhile',
      });
      notify();
    } finally {
      release();
    }
    await restored;

    await vi.waitFor(() => expect(state.value).toBe('stored-meanwhile'));
  });

  it('does not revive a legacy seed migration after another window resets the wallet', async () => {
    await modules.ensureVaultReady();
    expect(modules.readVault().revision).toBeNull();
    modules.VAULT_KEYS.forEach((key) => modules.WalletStorage.remove(key));
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    let markEntered;
    const entered = new Promise((resolve) => { markEntered = resolve; });
    const restoreFailed = vi.fn();
    const restored = new Promise((resolve) => {
      modules.useStorageRef('', modules.STORAGE_KEYS.mnemonic, {
        migrations: [async () => {
          markEntered();
          await gate;
          return 'old-legacy-mnemonic';
        }],
        onRestoreFailed: restoreFailed,
        onRestored: resolve,
      });
    });
    await entered;
    let empty;
    try {
      await modules.clearVault();
      empty = modules.readVault();
    } finally {
      release();
    }
    await restored;

    expect(restoreFailed).toHaveBeenCalledWith(expect.any(modules.VaultResetError));
    expect(modules.readVault()).toEqual(empty);
    expect(modules.readVault().values[modules.STORAGE_KEYS.mnemonic]).toBeNull();
  });

  it('does not consult legacy seed storage when startup reads a reset vault', async () => {
    await modules.clearVault();
    const migrateLegacySeed = vi.fn().mockResolvedValue('old-legacy-mnemonic');
    let state;
    await new Promise((resolve) => {
      state = modules.useStorageRef('', modules.STORAGE_KEYS.mnemonic, {
        migrations: [migrateLegacySeed],
        onRestored: resolve,
      });
    });

    expect(migrateLegacySeed).not.toHaveBeenCalled();
    expect(state.value).toBe('');
    expect(modules.readVault().values[modules.STORAGE_KEYS.mnemonic]).toBeNull();
  });

  it('rejects an old import completing after rotation and preserves the new generation', async () => {
    const accounts = await bootAccounts();
    const paused = pauseEncryption((plaintext) => plaintext.includes('"data":[170,'));
    const importing = accounts.addPrivateKeyAccount(importedAccount('aa'));
    const rejectedImport = expect(importing).rejects.toThrow(/password|key|wallet changed/i);
    await paused.entered;
    const salt = modules.generateSalt();
    const newKey = await modules.generateEncryptionKey('new-password', salt);
    const snapshot = modules.readVault();
    const next = {
      ...snapshot.values,
      [modules.STORAGE_KEYS.encryptionSalt]: modules.encodeBase64(salt),
      [modules.STORAGE_KEYS.mnemonic]: await modules.encrypt(newKey, MNEMONIC),
      [modules.STORAGE_KEYS.privateKeyAccountsRaw]: await modules.encrypt(newKey, '[]'),
    };
    let committed;
    try {
      committed = await modules.commitVault(snapshot, next);
    } finally {
      paused.release();
    }
    await rejectedImport;
    expect(modules.readVault()).toEqual(committed);
    const ciphertext = modules.readVault().values[modules.STORAGE_KEYS.privateKeyAccountsRaw];
    expect(await modules.decrypt(newKey, ciphertext)).toBe('[]');
  });

  it('does not take the keys of a new password for unreadable ones before its key arrives', async () => {
    const accounts = await bootAccounts();
    const salt = modules.generateSalt();
    const newKey = await modules.generateEncryptionKey('new-password', salt);
    const snapshot = modules.readVault();
    keyIsCurrent = false;
    await modules.commitVault(snapshot, {
      ...snapshot.values,
      [modules.STORAGE_KEYS.encryptionSalt]: modules.encodeBase64(salt),
      [modules.STORAGE_KEYS.mnemonic]: await modules.encrypt(newKey, MNEMONIC),
      [modules.STORAGE_KEYS.privateKeyAccountsRaw]: await modules.encrypt(newKey, '[]'),
    });
    await expect(accounts.addPrivateKeyAccount(importedAccount('aa')))
      .rejects.toThrow('The password was changed in another window');
    // Time for a decrypt with the old key to fail.
    await new Promise((resolve) => { setTimeout(resolve, 50); });

    // As this window's own password change publishes its key, an import right after it.
    encryptionKey.value = newKey;
    keyIsCurrent = true;
    await expect(accounts.addPrivateKeyAccount(importedAccount('aa'))).resolves.toBe(1);

    expect(openConfirmModal).not.toHaveBeenCalled();
    const ciphertext = modules.readVault().values[modules.STORAGE_KEYS.privateKeyAccountsRaw];
    expect(JSON.parse(await modules.decrypt(newKey, ciphertext))).toHaveLength(1);
  });

  it('removes nothing once another window changed the password, though the removal was confirmed', async () => {
    await modules.ensureVaultReady();
    await modules.writeVaultField(modules.STORAGE_KEYS.privateKeyAccountsRaw, 'unreadable-ciphertext');
    const accounts = await bootAccounts();
    // Refused as the stored keys can't be decrypted; the removal it offers is dismissed.
    await expect(accounts.addPrivateKeyAccount(importedAccount('aa'))).rejects.toThrow();
    let confirmRemoval;
    openConfirmModal.mockImplementation(() => new Promise((resolve) => {
      confirmRemoval = resolve;
    }));
    const offered = accounts.offerToRemoveUnreadablePrivateKeyAccounts();

    const salt = modules.generateSalt();
    const newKey = await modules.generateEncryptionKey('new-password', salt);
    const snapshot = modules.readVault();
    keyIsCurrent = false;
    await modules.commitVault(snapshot, {
      ...snapshot.values,
      [modules.STORAGE_KEYS.encryptionSalt]: modules.encodeBase64(salt),
      [modules.STORAGE_KEYS.mnemonic]: await modules.encrypt(newKey, MNEMONIC),
      [modules.STORAGE_KEYS.privateKeyAccountsRaw]: await modules.encrypt(newKey, '[]'),
    });
    const committed = modules.readVault();
    confirmRemoval();
    await offered;

    expect(modules.readVault()).toEqual(committed);
  });

  it('keeps a key another window imported while the removal was offered', async () => {
    await modules.ensureVaultReady();
    await modules.writeVaultField(modules.STORAGE_KEYS.privateKeyAccountsRaw, 'unreadable-ciphertext');
    const accounts = await bootAccounts();
    let confirmRemoval;
    openConfirmModal.mockImplementation(() => new Promise((resolve) => {
      confirmRemoval = resolve;
    }));
    const offered = accounts.offerToRemoveUnreadablePrivateKeyAccounts();

    // The other window removes them and imports a key this window hasn't decrypted yet.
    const imported = JSON.stringify([importedAccount('bb')]);
    const decrypting = new Promise((resolve) => {
      const realDecrypt = globalThis.crypto.subtle.decrypt.bind(globalThis.crypto.subtle);
      vi.spyOn(globalThis.crypto.subtle, 'decrypt').mockImplementation(async (...args) => {
        resolve(undefined);
        await new Promise(() => {});
        return realDecrypt(...args);
      });
    });
    await modules.writeVaultField(
      modules.STORAGE_KEYS.privateKeyAccountsRaw,
      await modules.encrypt(encryptionKey.value, imported),
    );
    const committed = modules.readVault();
    await decrypting;
    confirmRemoval();
    await offered;

    expect(modules.readVault()).toEqual(committed);
    vi.mocked(globalThis.crypto.subtle.decrypt).mockRestore();
    expect(await modules.decrypt(
      encryptionKey.value,
      committed.values[modules.STORAGE_KEYS.privateKeyAccountsRaw],
    )).toBe(imported);
  });
});
