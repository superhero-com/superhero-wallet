import { Ref, ref, watch } from 'vue';
import type { Migration, StorageKey } from '@/types';
import { WalletStorage } from '@/lib/WalletStorage';
import { asyncPipe, handleUnknownError } from '@/utils';
import { SecureMobileStorage } from '@/lib/SecureMobileStorage';
import { IS_MOBILE_APP, STORAGE_KEYS } from '@/constants';
import {
  ensureVaultReady,
  isVaultKey,
  readVault,
  refreshVault,
  subscribeVault,
  VaultConflictError,
  VaultResetError,
  writeVaultField,
} from '@/lib/WalletVault';
import type { VaultSnapshot } from '@/lib/WalletVault';
import { registerStorageRefWrites, registerVaultRef } from '@/utils/vaultRef';

export interface ICreateStorageRefOptions<T, TSerialized = unknown> {
  /**
   * Enable secure storage for the data.
   * Mobile app only.
   */
  enableSecureStorage?: boolean;
  /**
   * Enable state synchronization between the extension and the background.
   */
  backgroundSync?: boolean;
  /**
   * Callbacks run on the data that will be saved and read from the browser storage.
   */
  serializer?: {
    read: (val: TSerialized) => T;
    write: (val: T) => TSerialized;
  };
  migrations?: Migration<TSerialized>[];
  /**
   * Allows to ensure the state is already synced with browser storage and migrated.
   */
  onRestored?: (val: T | null) => any;
  /**
   * Runs when the stored value can't be read or migrated. The state keeps its initial value
   * and `onRestored` is called with `null` after it.
   */
  onRestoreFailed?: (error: unknown) => any;
  /**
   * Allows to run a callback whenever the state is synced with the background.
   */
  onBackgroundSync?: (val: T) => any;
}

/**
 * Create a Vue ref with value synced in the Browser's storage.
 * Also allows to sync the state between the app and the extension background.
 * Inspired by `useStorage`: https://vueuse.org/core/useStorage/
 */
export function useStorageRef<T = string | object | any[], TSerialized = unknown>(
  initialState: T,
  storageKey: StorageKey,
  options: ICreateStorageRefOptions<T, TSerialized> = {},
) {
  const {
    enableSecureStorage = false,
    serializer = {
      read: (a: unknown) => a,
      write: (a: unknown) => a,
    } as unknown as NonNullable<typeof options['serializer']>,
    backgroundSync = false,
    migrations,
    onRestored,
    onRestoreFailed,
    onBackgroundSync,
  } = options;

  let watcherDisabled = false; // Avoid watcher going infinite loop
  let latestWrite = Promise.resolve();
  const state = ref(initialState) as Ref<T>; // https://github.com/vuejs/core/issues/2136/
  const storage = (enableSecureStorage && IS_MOBILE_APP) ? SecureMobileStorage : WalletStorage;
  const vaultBacked = isVaultKey(storageKey);

  function applyVaultValue(value: TSerialized | null) {
    watcherDisabled = true;
    try {
      state.value = value === null ? initialState : serializer.read(value);
    } finally {
      watcherDisabled = false;
    }
  }

  /** Not decoded again: a new object, e.g. of the salt, would look like a change to watchers. */
  function isStateStoredAs(value: TSerialized | null) {
    if (value === null) return state.value === initialState;
    return !!state.value && serializer.write(state.value) === value;
  }

  function writeLogEntry(message: string, error: unknown) {
    const { message: reason, stack } = (error instanceof Error)
      ? error
      : { message: String(error), stack: undefined };
    // Loaded here, as the logger's imports lead back to this module.
    import('@/lib/logger').then(({ default: Logger }) => Logger.write({
      message: `${message}: ${reason}`,
      stack,
      type: 'api-response',
      modal: false,
    })).catch(handleUnknownError);
  }

  if (vaultBacked) {
    registerVaultRef(state, {
      storageKey,
      apply: (value) => applyVaultValue(value as TSerialized | null),
    });
  } else {
    registerStorageRefWrites(state, () => latestWrite);
  }

  async function setLocalState(val: TSerialized | null) {
    if (vaultBacked) {
      applyVaultValue(val);
      return;
    }
    if (val !== null) {
      watcherDisabled = true;
      state.value = await serializer.read(val);
      setTimeout(() => { watcherDisabled = false; }, 0);
    }
  }

  async function setStorageState(val: T | null) {
    const expected = vaultBacked ? readVault() : undefined;
    const serialized = val ? serializer.write(val) : val;
    if (vaultBacked) {
      await writeVaultField(storageKey, serialized as string | null, expected);
    } else {
      await storage.set(storageKey, serialized);
    }
  }

  /** Resolves with the value to use: a newer one stored meanwhile wins over the migration. */
  async function storeMigratedValue(
    value: TSerialized,
    restoreSnapshot: VaultSnapshot | undefined,
  ): Promise<TSerialized | null> {
    if (!vaultBacked) {
      await storage.set(storageKey, value);
      return value;
    }
    let expected = restoreSnapshot!;
    // Retried after an unrelated commit.
    for (let attempt = 0; ; attempt += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await writeVaultField(storageKey, value as string, expected);
        return value;
      } catch (error) {
        if (!(error instanceof VaultConflictError) || attempt >= 9) throw error;
        // eslint-disable-next-line no-await-in-loop
        await refreshVault();
        expected = readVault();
        if (expected.values[storageKey] !== restoreSnapshot!.values[storageKey]
          || expected.values[STORAGE_KEYS.encryptionSalt]
            !== restoreSnapshot!.values[STORAGE_KEYS.encryptionSalt]) {
          return expected.values[storageKey] as TSerialized | null;
        }
      }
    }
  }

  // Restore state and run watchers
  (async () => {
    let restoredValue: TSerialized | null = null;
    let isRestoreFailed = false;
    let isMigrationWriteFailed = false;
    try {
      if (vaultBacked) await ensureVaultReady();
      const restoreSnapshot = vaultBacked ? readVault() : undefined;
      restoredValue = await storage.get<TSerialized | null>(storageKey);
      // Not once the vault exists, which older copies mustn't replace.
      if (migrations?.length && (!vaultBacked || restoreSnapshot?.revision === null)) {
        // iOS Keychain writes delete the item first, so don't rewrite an unchanged value
        const storedValue = JSON.stringify(restoredValue);
        restoredValue = await asyncPipe<TSerialized | null>(migrations)(restoredValue!);
        if (restoredValue !== null && JSON.stringify(restoredValue) !== storedValue) {
          const migratedValue = restoredValue;
          try {
            restoredValue = await storeMigratedValue(migratedValue, restoreSnapshot);
          } catch (error) {
            // Another window deleted the wallet: keeping its old copy would bring it back.
            if (error instanceof VaultResetError) throw error;
            // Not unreadable: the migrated value is kept, as a failed iOS Keychain write
            // may have deleted the original already.
            isMigrationWriteFailed = true;
            handleUnknownError(error);
            writeLogEntry(`Saving the updated "${storageKey}" failed`, error);
          }
        }
      }
      /**
       * `onRestored` must run after `setLocalState` so reactive refs (e.g. mnemonic)
       * are populated before guards like `checkUserAuth` observe `isMnemonicRestored`.
       * Previously `onRestored` fired first, which could leave `mnemonic.value` empty
       * while `isMnemonicRestored` was already true — skipping the password modal and
       * breaking flows such as deep links / e2e `cy.login(..., '/invite/...')`.
       */
      await setLocalState(restoredValue);
    } catch (error) {
      // E.g. Android rejects a Keystore read it can't decrypt; waiting callers must not hang.
      handleUnknownError(error);
      // For the exportable error log.
      writeLogEntry(`Reading "${storageKey}" from the storage failed`, error);
      restoredValue = null;
      isRestoreFailed = true;
      onRestoreFailed?.(error);
    }
    onRestored?.(
      restoredValue == null ? restoredValue as T : state.value,
    );

    /**
     * Synchronize the state value with the storage.
     * A value that couldn't be read may still be stored intact, so only a caller
     * that handles the failure (`onRestoreFailed`) gets to write over it.
     */
    if (!isRestoreFailed || onRestoreFailed) {
      watch(state, (val) => {
        if (!watcherDisabled) {
          latestWrite = setStorageState(val);
          latestWrite.catch((error) => {
            handleUnknownError(error);
            writeLogEntry(`Saving "${storageKey}" failed`, error);
          });
        }
      }, { deep: true, flush: vaultBacked ? 'sync' : 'pre' });
    }

    /**
     * Two way binding between the extension and the background
     * Whenever the app saves the state to browser storage the extension background
     * and the offscreen tab pick this and synchronize their own state with the change.
     */
    if (vaultBacked) {
      subscribeVault((snapshot) => {
        const value = snapshot.values[storageKey as keyof typeof snapshot.values] as
          TSerialized | null;
        if (isStateStoredAs(value)) return;
        applyVaultValue(value);
        if (backgroundSync) onBackgroundSync?.(state.value);
      });
      // Catches up with commits made during the restore, keeping a migrated value not stored.
      // Already cached: any later one, also of another window, reaches the listener.
      if (!isRestoreFailed && !isMigrationWriteFailed) {
        try {
          const value = WalletStorage.get<TSerialized>(storageKey);
          if (!isStateStoredAs(value)) applyVaultValue(value);
        } catch (error) {
          handleUnknownError(error);
          onRestoreFailed?.(error);
        }
      }
    } else if (backgroundSync) {
      storage.watch?.(storageKey, (val) => {
        setLocalState(val);
        onBackgroundSync?.(val);
      });
    }
  })();

  return state;
}
