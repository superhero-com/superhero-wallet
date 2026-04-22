import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import {
  computed,
  reactive,
  readonly,
  ref,
  watch,
} from 'vue';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

import { tg as t } from '@/popup/plugins/i18n';
import Logger from '@/lib/logger';
import {
  AUTHENTICATION_TIMEOUTS,
  IS_EXTENSION,
  IS_IOS,
  IS_MOBILE_APP,
  IS_OFFSCREEN_TAB,
  RUNNING_IN_TESTS,
  STORAGE_KEYS,
} from '@/constants';
import {
  createCustomScopedComposable,
  decodeBase64,
  decrypt,
  decryptedComputed,
  encodeBase64,
  encrypt,
  excludeFalsy,
  generateEncryptionKey,
  generateSalt,
  getOrCreateMobileEncryptionKey,
  getSessionEncryptionKey,
  handleUnknownError,
  sessionEnd,
  sessionStart,
  watchUntilTruthy,
} from '@/utils';

import migrateMnemonicVuexToComposable from '@/migrations/002-mnemonic-vuex-to-composable';
import migrateMnemonicCordovaToIonic from '@/migrations/008-mnemonic-cordova-to-ionic';
import migrateMnemonicMobileToSecureStorage from '@/migrations/010-mnemonic-mobile-to-secure-storage';
import migrateMobileSensitiveDataEncryption from '@/migrations/011-mobile-sensitive-data-encryption';
import {
  LEGACY_DEFAULT_PASSWORD,
  clearDefaultPasswordSecret,
  getDefaultPasswordSecret,
  getOrCreateDefaultPasswordSecret,
} from './defaultPassword';

import { useUi } from './ui';
import { useModals } from './modals';
import { useStorageRef } from './storageRef';

const CHECK_FOR_SESSION_KEY_INTERVAL = 5000;
const CHECK_FOR_SESSION_KEY_TIMEOUT = 30000;
const AUTHENTICATION_TIMEOUT_DEFAULT = (IS_MOBILE_APP)
  ? AUTHENTICATION_TIMEOUTS[0]
  : AUTHENTICATION_TIMEOUTS[2];

/**
 * Top level composable that controls if user is allowed to interact with the wallet.
 * It uses two different ways of authentication:
 *   1. Biometric (fingerprint scanner/face recognition) for mobile devices (Ionic).
 *   2. Password protection (encrypting the mnemonic) for web and extension.
 */
export const useAuth = createCustomScopedComposable(() => {
  const {
    isBiometricLoginEnabled,
    isAppActive,
    setBiometricLoginEnabled,
    setLoaderVisible,
  } = useUi();
  const {
    openBiometricLoginModal,
    openPasswordLoginModal,
    openEnableBiometricLoginModal,
  } = useModals();

  let isSessionExpired = false;
  let expirationTimeout: NodeJS.Timeout;

  /** Common state for both biometric or password protection */
  const isAuthenticated = ref(false);
  const isAuthenticating = ref(false);
  const isMnemonicRestored = ref(false);
  /** User skipped setting password so the test one was used */
  const isUsingDefaultPassword = ref(false);
  const encryptionKey = ref<CryptoKey>();

  /**
   * Depending on environment and app version this value
   * can be both encrypted (web & extension since v2.3) or decrypted (mobile).
   */
  const mnemonic = useStorageRef<string>(
    '',
    STORAGE_KEYS.mnemonic,
    {
      backgroundSync: true,
      enableSecureStorage: true,
      migrations: [
        (IS_MOBILE_APP && IS_IOS) ? migrateMnemonicCordovaToIonic : null,
        migrateMnemonicVuexToComposable,
        (IS_MOBILE_APP) ? migrateMnemonicMobileToSecureStorage : null,
        /**
         * Encrypt legacy plaintext mnemonic on mobile with the
         * per-install mobile encryption key. Order matters — this must
         * run AFTER `migrateMnemonicMobileToSecureStorage` which moves
         * the mnemonic into SecureMobileStorage, and BEFORE the ref's
         * value is set so the reactive layer only ever sees ciphertext.
         */
        (IS_MOBILE_APP) ? migrateMobileSensitiveDataEncryption : null,
      ].filter(excludeFalsy),
      onRestored() {
        isMnemonicRestored.value = true;
      },
    },
  );

  /** Part of the `encryptionKey` that is used to encrypt/decrypt protected data */
  const encryptionSalt = useStorageRef<Uint8Array | null, string>(
    null,
    STORAGE_KEYS.encryptionSalt,
    {
      backgroundSync: true,
      enableSecureStorage: true,
      serializer: {
        write: (val) => encodeBase64(val!),
        read: (val) => val ? decodeBase64(val as any) : null,
      },
    },
  );

  const secureLoginTimeout = useStorageRef<string | null>(
    null,
    STORAGE_KEYS.secureLoginTimeout,
    {
      backgroundSync: true,
      enableSecureStorage: true,
      /**
       * Migrate legacy plaintext secure-login-timeout blobs on
       * mobile. The value is small (just a numeric string) but it still
       * leaks "how impatient is this user" metadata via `adb backup`
       * or a jailbroken Keychain dump — and more importantly, shares
       * the same `decryptedComputed` plumbing as the other sensitive
       * blobs. Omitting the migration here would trip the decrypt
       * watcher on first launch.
       */
      migrations: IS_MOBILE_APP ? [migrateMobileSensitiveDataEncryption] : [],
    },
  );

  const secureLoginTimeoutDecrypted = decryptedComputed(
    encryptionKey,
    secureLoginTimeout,
    AUTHENTICATION_TIMEOUT_DEFAULT,
  );
  /**
   * If mnemonic is invalid, it is most likely encrypted.
   *
   * The previous `!IS_MOBILE_APP` short-circuit — which assumed
   * mnemonic-on-mobile is always plaintext — is gone. On mobile we now
   * also encrypt the mnemonic at rest, using the per-install mobile key
   * loaded in the init IIFE below.
   */
  const isMnemonicEncrypted = computed(
    () => !!mnemonic.value && !validateMnemonic(mnemonic.value, wordlist),
  );
  const mnemonicEncrypted = computed(() => isMnemonicEncrypted.value ? mnemonic.value : null);
  const mnemonicDecrypted = ref('');

  const mnemonicSeed = computed(
    () => mnemonicDecrypted.value === '' ? null : mnemonicToSeedSync(mnemonicDecrypted.value),
  );

  const biometricAuth = reactive({
    available: false,
    updating: false,
    checked: false,
  });

  /**
   * Checks if biometric authentication is available on the device.
   */
  async function checkBiometricLoginAvailability({ forceUpdate = false } = {}) {
    if (!IS_MOBILE_APP) {
      return false;
    }
    if (biometricAuth.updating) {
      await watchUntilTruthy(() => !biometricAuth.updating);
    } else if (!biometricAuth.checked || forceUpdate) {
      biometricAuth.updating = true;
      biometricAuth.available = (await BiometricAuth.checkBiometry()).isAvailable;
      biometricAuth.checked = true;
      biometricAuth.updating = false;
    }
    if (!biometricAuth.available && isBiometricLoginEnabled.value) {
      setBiometricLoginEnabled(false);
    }
    return biometricAuth.available;
  }

  /**
   * Setting/Resetting the password key logs the user in/out.
   */
  function setEncryptionKey(newEncryptionKey?: CryptoKey) {
    encryptionKey.value = newEncryptionKey;
    if (IS_EXTENSION) {
      if (newEncryptionKey) {
        sessionStart(newEncryptionKey);
      } else {
        sessionEnd();
      }
    }
  }

  async function getEncryptionKey() {
    const key = await watchUntilTruthy(encryptionKey);
    return key;
  }

  async function setPassword(password: string, plaintextToEncrypt = mnemonicDecrypted.value) {
    /**
     * Derive the new key and ciphertext into local variables FIRST,
     * then commit all persistent state synchronously once every async
     * step has succeeded. If we were to write `encryptionSalt.value`
     * upfront and then hit an exception in `generateEncryptionKey` or
     * `encrypt`, on-disk state would be wedged: salt is fresh but the
     * mnemonic ciphertext is still under the old key, so the next
     * launch derives a mismatched key and locks the user out
     * permanently — there is no way back from an AES-GCM auth-tag
     * mismatch. Particularly important for the legacy-password
     * rotation path in `checkUserAuth`, which invokes `setPassword`
     * on every boot of a legacy install.
     */
    const newSalt = generateSalt();
    const newEncryptionKey = await generateEncryptionKey(password, newSalt);
    const newMnemonicCiphertext = await encrypt(newEncryptionKey, plaintextToEncrypt);
    encryptionSalt.value = newSalt;
    setEncryptionKey(newEncryptionKey);
    mnemonic.value = newMnemonicCiphertext;
    isAuthenticated.value = true;
  }

  async function setMnemonicAndInitializeAuthentication(newMnemonic: string, isRestored = false) {
    if (IS_MOBILE_APP) {
      /**
       * Mobile mnemonic is now stored encrypted with the
       * per-install mobile encryption key, matching the extension/web
       * encrypted-at-rest model. The key is loaded into `encryptionKey`
       * here (if not already loaded by the init IIFE) so downstream
       * `decryptedComputed` state — imported private keys, preclaimed
       * names, secure-login timeout — is also encrypted via the shared
       * reactive key.
       */
      if (!encryptionKey.value) {
        const mobileKey = await getOrCreateMobileEncryptionKey();
        setEncryptionKey(mobileKey);
      }
      mnemonic.value = await encrypt(encryptionKey.value!, newMnemonic);
      if (await checkBiometricLoginAvailability()) {
        await openEnableBiometricLoginModal();
      }
    } else {
      const { openSetPasswordModal } = useModals();
      const password = await openSetPasswordModal(isRestored).catch(() => {
        throw new Error('Password was not set.');
      });
      await setPassword(password, newMnemonic);

      const storedSecret = await getDefaultPasswordSecret();
      if (storedSecret && storedSecret === password) {
        isUsingDefaultPassword.value = true;
      }
    }
    mnemonicDecrypted.value = newMnemonic;
    /**
     * The user just handed us a valid mnemonic (generated or restored) and we
     * have written it to encrypted storage, so this session is authenticated.
     * The extension/web path already set `isAuthenticated = true` transitively
     * through `setPassword`, but the mobile path previously did not — and now
     * that `isMnemonicEncrypted` is `true` on mobile as well, leaving the flag
     * at `false` would let auth-gated guards observe an encrypted-looking
     * mnemonic with `isAuthenticated === false`, redirecting the user straight
     * back to a login flow for an install they just created. Asserting the
     * flag once here covers both environments and is idempotent.
     */
    isAuthenticated.value = true;
  }

  /**
   * Try to obtain the encryption key from extension's background process.
   */
  async function syncBackgroundEncryptionKey() {
    await new Promise<void>((resolve) => {
      let interval: ReturnType<typeof setInterval>;
      let timeout: ReturnType<typeof setTimeout>;
      const finish = () => {
        clearInterval(interval);
        clearTimeout(timeout);
        resolve();
      };
      interval = setInterval(async () => {
        const sessionEncryptionKey = await getSessionEncryptionKey();
        if (sessionEncryptionKey) {
          mnemonicDecrypted.value = await decrypt(sessionEncryptionKey, mnemonicEncrypted.value!);
          setEncryptionKey(sessionEncryptionKey);
          finish();
        }
      }, CHECK_FOR_SESSION_KEY_INTERVAL);
      timeout = setTimeout(finish, CHECK_FOR_SESSION_KEY_TIMEOUT);
    });
  }

  async function authenticateWithPassword(password: string): Promise<boolean> {
    if (!isAuthenticated.value && isMnemonicEncrypted.value) {
      const key = await generateEncryptionKey(password, encryptionSalt.value!);
      const decryptionResult = await decrypt(key, mnemonicEncrypted.value!);
      setEncryptionKey(key);

      if (!decryptionResult) {
        return false;
      }

      mnemonicDecrypted.value = decryptionResult;
      isAuthenticated.value = true;
    }
    return true;
  }

  async function authenticateWithBiometry(force = false): Promise<boolean> {
    if (
      (
        !isAuthenticated.value
        || force
      )
      && isBiometricLoginEnabled.value
      && await checkBiometricLoginAvailability()
    ) {
      return BiometricAuth.authenticate({
        reason: t('biometricAuth.reason'),
        cancelTitle: t('common.cancel'),
        allowDeviceCredential: true,
        iosFallbackTitle: t('biometricAuth.fallbackTitle'),
        androidTitle: t('biometricAuth.title'),
        androidSubtitle: t('biometricAuth.subtitle'),
        androidConfirmationRequired: false,
      }).then(() => {
        isAuthenticated.value = true;
        return true;
      });
    }
    return true;
  }

  /**
   * Open biometric login or password login modal depending on the environment settings.
   * The modals then uses one of the `authenticateWithPassword`
   * or `authenticateWithBiometry` methods.
   */
  async function checkUserAuth(): Promise<any> {
    await watchUntilTruthy(isMnemonicRestored);

    if (!mnemonic.value || isAuthenticated.value) {
      return;
    }
    if (isAuthenticating.value) {
      await watchUntilTruthy(() => !isAuthenticating.value || isAuthenticated.value);
      return;
    }

    isUsingDefaultPassword.value = false;
    isAuthenticating.value = true;

    if (IS_MOBILE_APP) {
      /**
       * Mobile state is now AES-GCM encrypted with the per-install
       * mobile key. Make sure the key is in `encryptionKey` and that
       * `mnemonicDecrypted` has been populated from the encrypted storage
       * before we mark the user authenticated, otherwise downstream
       * consumers observing `isAuthenticated` would race a still-encrypted
       * mnemonic.
       */
      if (!encryptionKey.value) {
        const mobileKey = await getOrCreateMobileEncryptionKey();
        setEncryptionKey(mobileKey);
      }
      if (isMnemonicEncrypted.value && !mnemonicDecrypted.value) {
        try {
          mnemonicDecrypted.value = await decrypt(encryptionKey.value!, mnemonic.value);
        } catch (error) {
          /**
           * Decrypt can fail when the Keychain was cleared (fresh
           * `mobile-data-key` no longer matches the ciphertext), when the
           * device was restored from a backup that preserved app storage
           * but not the Keychain, or when the blob is genuinely corrupt.
           * In every one of these cases the mnemonic is unrecoverable
           * from this install — we cannot derive `mnemonicSeed` and no
           * account list will be populated.
           *
           * Previously this was silently swallowed and execution fell
           * through to the else branch which unconditionally set
           * `isAuthenticated.value = true`, leaving the UI in a "logged
           * in" state with zero accounts, no error feedback, and no
           * path forward. Surface the failure explicitly, clear the
           * in-progress flag (no `try/finally` covers this branch
           * because the subsequent biometric/else paths must be
           * skipped entirely, not just unwound), and bail without
           * authenticating.
           */
          handleUnknownError(error);
          Logger.write({
            title: 'Wallet data unreadable',
            message: (
              'Your encrypted wallet data could not be decrypted. '
              + 'This usually means the device Keychain was cleared or the app '
              + 'was restored from a backup that did not include it. Reinstall '
              + 'the app and restore from your seed phrase to recover.'
            ),
            type: 'api-response',
            modal: true,
          });
          isAuthenticating.value = false;
          return;
        }
      }
      if (isBiometricLoginEnabled.value && await checkBiometricLoginAvailability()) {
        try {
          await openBiometricLoginModal();
        } catch {
          isAuthenticating.value = false;
          return;
        }
      } else {
        isAuthenticated.value = true;
      }
    } else if (isMnemonicEncrypted.value) {
      // Environments that will always ask user about password
      const autoLoginDisabledEnv = IS_OFFSCREEN_TAB || RUNNING_IN_TESTS;

      /**
       * Attempt to log in with the per-install default-password
       * secret when the user previously skipped password protection.
       * This check needs to go first as we need to know if default
       * password was used.
       *
       * Two lookups run in order:
       *   1. The per-install random secret stored under
       *      `STORAGE_KEYS.defaultPasswordSecret` — used by newer
       *      installs. Each install holds an independent 256-bit random
       *      value, so compromising this repository (or one user's
       *      storage) no longer reveals every other user's "default"
       *      password.
       *   2. The legacy hardcoded `LEGACY_DEFAULT_PASSWORD` — accepted
       *      only as an unlock-then-rotate fallback for installs that
       *      were seeded under the pre-upgrade "skip password" flow.
       *      Immediately after a successful legacy unlock we re-encrypt
       *      the on-disk blobs under a freshly generated random secret
       *      (see below), so the hardcoded string is never relied on
       *      across sessions.
       *
       * Each attempt tolerates failure. `authenticateWithPassword`
       * can either return `false` (empty decryption result) OR throw
       * (AES-GCM auth-tag mismatch on wrong password), so both paths are
       * swallowed here — a wrong guess must not abort the rest of
       * `checkUserAuth` and leave the user staring at a blank screen.
       * The stale `encryptionKey` that `authenticateWithPassword` sets
       * as a side-effect of a failed decrypt is also cleared so the
       * next attempt and any subsequent manual login runs cleanly.
       */
      if (!encryptionKey.value && !autoLoginDisabledEnv) {
        const tryDefaultPassword = async (candidate: string): Promise<boolean> => {
          try {
            const ok = await authenticateWithPassword(candidate);
            if (ok && isAuthenticated.value) {
              return true;
            }
          } catch { /* NOOP — wrong candidate, fall through */ }
          /**
           * Clear only the reactive ref — do NOT go through
           * `setEncryptionKey(undefined)` which calls `sessionEnd()`
           * and wipes the session key from `browser.storage.session`.
           * A failed default-password guess must not destroy an
           * existing valid session; the session-restore path that
           * runs right after this block needs that key intact.
           */
          encryptionKey.value = undefined;
          return false;
        };

        const storedSecret = await getDefaultPasswordSecret();
        if (storedSecret && await tryDefaultPassword(storedSecret)) {
          isUsingDefaultPassword.value = true;
        }

        if (!isAuthenticated.value && await tryDefaultPassword(LEGACY_DEFAULT_PASSWORD)) {
          isUsingDefaultPassword.value = true;
          /**
           * Transparently rotate legacy "skip password" installs off the
           * hardcoded `testPassword123` sentinel the moment we unlock
           * with it. We drop any stale stored secret first (defensive —
           * if one existed, `storedSecret` would have worked above and
           * we would not be on this path), then mint a new per-install
           * 256-bit random secret and hand it to `setPassword`, which:
           *   - generates a fresh `encryptionSalt`,
           *   - derives a new AES-GCM key and publishes it on
           *     `encryptionKey`, which triggers every `decryptedComputed`
           *     watcher (imported private keys in `accounts.ts`,
           *     preclaimed names in `aeNames.ts`, the secure-login
           *     timeout above) to re-encrypt its ciphertext under the
           *     new key,
           *   - re-encrypts the mnemonic on top of that key.
           * After this runs the on-disk state no longer depends on any
           * value shipped in source, and subsequent launches take the
           * `storedSecret` branch above.
           */
          try {
            await clearDefaultPasswordSecret();
            const rotatedSecret = await getOrCreateDefaultPasswordSecret();
            await setPassword(rotatedSecret);
          } catch (error) {
            // Rotation is best-effort — a failure here still leaves the
            // user authenticated under the legacy password, matching
            // pre-fix behavior, and the next successful login will retry.
            handleUnknownError(error);
          }
        }
      }

      // If default password auth failed, check if extension can be restored
      // by using data stored in the background process.
      if (!encryptionKey.value && !autoLoginDisabledEnv && IS_EXTENSION) {
        setLoaderVisible(true);
        const sessionEncryptionKey = await getSessionEncryptionKey();
        if (sessionEncryptionKey) {
          setEncryptionKey(sessionEncryptionKey);
          mnemonicDecrypted.value = await decrypt(sessionEncryptionKey, mnemonic.value);
          isAuthenticated.value = true;
        }
        setLoaderVisible(false);
      }

      // Finally if other attempts failed, ask user for the password.
      if (!encryptionKey.value) {
        await openPasswordLoginModal();
      }
    } else if (!isMnemonicEncrypted.value) {
      // Migrate the unprotected mnemonic by forcing user to set the password and encrypt it
      await setMnemonicAndInitializeAuthentication(mnemonic.value, true);
    }

    isAuthenticating.value = false;
  }

  async function logout() {
    setEncryptionKey(undefined);
    isAuthenticated.value = false;
  }

  async function lockWallet() {
    logout();
    checkUserAuth();
  }

  /**
   * Check if password provided by user is correct and if true update it to new one.
   */
  async function updatePassword(currentPassword: string, newPassword: string) {
    const key = await generateEncryptionKey(currentPassword, encryptionSalt.value!);
    await decrypt(key, mnemonicEncrypted.value!);
    await setPassword(newPassword);
  }

  (async () => {
    checkBiometricLoginAvailability();

    /**
     * Load the per-install mobile encryption key as soon as the
     * composable boots so `decryptedComputed` watchers (in `accounts.ts`,
     * `aeNames.ts`, and for `secureLoginTimeout` above) have a real
     * `encryptionKey` to work against — on mobile we now encrypt those
     * blobs instead of passing them through plaintext via the old
     * `IS_MOBILE_APP` bypass. The key-or-create is idempotent and shares
     * an in-memory cache with the mnemonic-migration hook, so no second
     * Keychain round-trip happens.
     */
    if (IS_MOBILE_APP && !encryptionKey.value) {
      const mobileKey = await getOrCreateMobileEncryptionKey();
      setEncryptionKey(mobileKey);
    }

    await watchUntilTruthy(() => mnemonic.value);

    if (!isMnemonicEncrypted.value) {
      mnemonicDecrypted.value = mnemonic.value;
    } else if (IS_MOBILE_APP && encryptionKey.value) {
      /**
       * Mirror the extension/web path — as soon as we have both
       * the encrypted mnemonic and the mobile encryption key, decrypt
       * into `mnemonicDecrypted` so `mnemonicSeed` and everything
       * derived from it becomes available without waiting for
       * `checkUserAuth` (which on mobile only gates the UI, not data).
       */
      try {
        mnemonicDecrypted.value = await decrypt(encryptionKey.value, mnemonic.value);
      } catch { /* NOOP — corrupted ciphertext will surface via auth flow */ }
    }

    if (!encryptionKey.value && IS_EXTENSION) {
      await checkUserAuth(); // Check auth when opening again the extension
    }
  })();

  if (IS_OFFSCREEN_TAB) {
    watch(
      encryptionSalt,
      () => syncBackgroundEncryptionKey(),
    );
  }

  /**
   * `isSessionExpired` is set to `false` whenever user is authenticated.
   * `isSessionExpired` is a web only feature that is in control of locking the
   * wallet after the tab was not active for a `secureLoginTimeout` amount of time.
   */
  watch(
    isAuthenticated,
    (val) => {
      if (val) {
        isSessionExpired = false;
      }
    },
  );

  watch(
    isAppActive,
    async (isActive, wasActive) => {
      // App resumed from background
      // Check if biometric auth is still available
      checkBiometricLoginAvailability({ forceUpdate: true });

      if (isActive && !wasActive) {
        clearInterval(expirationTimeout);

        // If session exists user needs to stay logged in
        if (!isAuthenticating.value) {
          const keepExtensionLoggedIn = !!(await getSessionEncryptionKey());
          if (isSessionExpired || (!keepExtensionLoggedIn && IS_EXTENSION)) {
            lockWallet();
          }
        }
      } else if (wasActive && !isActive) {
        expirationTimeout = setTimeout(
          () => {
            isSessionExpired = true;
          },
          +secureLoginTimeoutDecrypted.value!,
        );
      }
    },
  );

  return {
    isAuthenticated: readonly(isAuthenticated),
    isMnemonicRestored,
    isMnemonicEncrypted,
    isUsingDefaultPassword,
    mnemonic,
    mnemonicDecrypted,
    mnemonicEncrypted,
    mnemonicSeed,
    encryptionKey,
    encryptionSalt,
    generateMnemonic: () => generateMnemonic(wordlist),
    secureLoginTimeoutDecrypted,
    authenticateWithBiometry,
    authenticateWithPassword,
    checkBiometricLoginAvailability,
    checkUserAuth,
    getEncryptionKey,
    lockWallet,
    logout,
    setMnemonicAndInitializeAuthentication,
    setPassword,
    updatePassword,
  };
});
