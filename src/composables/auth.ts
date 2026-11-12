import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import {
  computed,
  reactive,
  readonly,
  ref,
  watch,
} from 'vue';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

import { tg as t } from '@/popup/plugins/i18n';
import Logger from '@/lib/logger';
import { StoredWalletFoundError, WrongPasswordError } from '@/lib/errors';
import { SecureMobileStorage } from '@/lib/SecureMobileStorage';
import { WalletStorage } from '@/lib/WalletStorage';
import {
  commitVault,
  ensureVaultReady,
  readVault,
  refreshVault,
  subscribeVault,
  VAULT_SECRET_KEYS,
  VaultConflictError,
  VaultSecretUnreadableError,
  VaultUnavailableError,
} from '@/lib/WalletVault';
import type { VaultKey, VaultSnapshot } from '@/lib/WalletVault';
import { getVaultRef } from '@/utils/vaultRef';
import {
  AUTHENTICATION_TIMEOUTS,
  IN_FRAME,
  IS_EXTENSION,
  IS_IOS,
  IS_MOBILE_APP,
  IS_OFFSCREEN_TAB,
  MODAL_RESET_WALLET,
  RUNNING_IN_POPUP,
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
  getMobileEncryptionKey,
  getOrCreateMobileEncryptionKey,
  getSessionEncryptionKey,
  handleUnknownError,
  isSameEncryptionKey,
  MobileEncryptionKeyMissingError,
  sessionEnd,
  sessionEndIfHolding,
  sessionHold,
  sessionRelease,
  sessionStart,
  watchUntilTruthy,
} from '@/utils';

import migrateMnemonicVuexToComposable from '@/migrations/002-mnemonic-vuex-to-composable';
import migrateMnemonicCordovaToIonic from '@/migrations/008-mnemonic-cordova-to-ionic';
import migrateMnemonicMobileToSecureStorage from '@/migrations/010-mnemonic-mobile-to-secure-storage';
import migrateMobileSensitiveDataEncryption from '@/migrations/011-mobile-sensitive-data-encryption';
import { removeLegacySecrets } from '@/migrations/migrationHelpers';
import {
  LEGACY_DEFAULT_PASSWORD,
  generateDefaultPasswordSecret,
  getDefaultPasswordSecret,
} from './defaultPassword';

import { useUi } from './ui';
import { useModals } from './modals';
import {
  hasFailedMigrationWrites,
  retryFailedMigrationWrites,
  useStorageRef,
} from './storageRef';

const CHECK_FOR_SESSION_KEY_INTERVAL = 5000;
const CHECK_FOR_SESSION_KEY_TIMEOUT = 30000;
/** How long a page waits for the key of a password changed in another window. */
const REMOTE_PASSWORD_CHANGE_SESSION_WAIT = 3000;
const REMOTE_PASSWORD_CHANGE_SESSION_INTERVAL = 250;
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
    openConfirmModal,
    openModal,
    openPasswordLoginModal,
    openEnableBiometricLoginModal,
  } = useModals();

  let isSessionExpired = false;
  let isManualMobileLockActive = false;
  let isUnreadableWalletModalOpen = false;
  let isMigrationWriteModalOpen = false;
  let biometricPromptsOpen = 0;
  /** The lock screen prompts by itself once each time the app is shown. */
  let canLockScreenAutoPrompt = true;
  let sessionExpiresAt: number | null = null;
  let expirationTimeout: NodeJS.Timeout;

  /** Common state for both biometric or password protection */
  const isAuthenticated = ref(false);
  const isAuthenticating = ref(false);
  const isMnemonicRestored = ref(false);
  /** The stored mnemonic couldn't be read, so it is empty but may still be stored. */
  const isMnemonicUnreadable = ref(false);
  let mnemonicReadError: unknown;
  /** User skipped setting password so the test one was used */
  const isUsingDefaultPassword = ref(false);
  const encryptionKey = ref<CryptoKey>();
  /** The salt of `encryptionKey`: the stored one may already be another window's. */
  let encryptionKeySalt: string | null = null;
  /** Changes with each login, lock or key change here, so a slower attempt can't publish. */
  let authEpoch = 0;
  /** The salt this window's own `setPassword` stores, before it publishes the key for it. */
  let ownRotationSalt: string | null = null;
  watch(encryptionKey, () => { authEpoch += 1; }, { flush: 'sync' });

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
      onRestoreFailed(error) {
        mnemonicReadError = error;
        isMnemonicUnreadable.value = true;
      },
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
    {
      // Picking it again replaces a setting the key can't read, e.g. to change the password.
      isReplacedWithoutReading: true,
      // eslint-disable-next-line no-use-before-define
      isKeyCurrent: isEncryptionKeyCurrent,
    },
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
    /** Biometrics, or the device passcode the prompt falls back to. */
    deviceCredentialAvailable: false,
    updating: false,
    checked: false,
  });
  const isAutoLockEnabled = computed(() => !IS_MOBILE_APP || isBiometricLoginEnabled.value);

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
      try {
        // Patched on Android to ignore a locked SIM, and a passcode that Android 10
        // can't prompt for without biometric hardware, see `patches/`.
        const { isAvailable, deviceIsSecure } = await BiometricAuth.checkBiometry();
        biometricAuth.available = isAvailable;
        biometricAuth.deviceCredentialAvailable = isAvailable || deviceIsSecure;
        biometricAuth.checked = true;
      } finally {
        biometricAuth.updating = false;
      }
    }
    // Locked out or unenrolled biometrics still leave the passcode to unlock with.
    if (!biometricAuth.deviceCredentialAvailable && isBiometricLoginEnabled.value) {
      setBiometricLoginEnabled(false);
    }
    return biometricAuth.available;
  }

  /** Checks if the user can be verified on the device, with biometrics or the passcode. */
  async function canAuthenticateWithDevice() {
    await checkBiometricLoginAvailability();
    return biometricAuth.deviceCredentialAvailable;
  }

  /**
   * Only a shown page keeps the session: not a hidden one, a dapp's confirmation popup,
   * or a wallet page a website embeds in a frame.
   */
  function isSessionKeepingPage() {
    return isAppActive.value && !RUNNING_IN_POPUP && !IN_FRAME;
  }

  /**
   * Setting/Resetting the password key logs the user in/out.
   * @param options.isFromSession The key was read from the session, where the background
   * already times it out.
   */
  function setEncryptionKey(
    newEncryptionKey?: CryptoKey,
    {
      isFromSession = false,
      salt = encryptionSalt.value ? encodeBase64(encryptionSalt.value) : null,
    }: { isFromSession?: boolean; salt?: string | null } = {},
  ) {
    // Kept through a lock: a write in flight may still finish with the key it captured.
    if (newEncryptionKey) encryptionKeySalt = salt;
    encryptionKey.value = newEncryptionKey;
    if (IS_EXTENSION) {
      if (newEncryptionKey) {
        const isKeepingSession = isSessionKeepingPage();
        // Storing it again would restart the timeout, e.g. with each dapp's popup.
        if (isFromSession && !isKeepingSession) {
          return;
        }
        sessionStart(newEncryptionKey);
        if (!isKeepingSession) {
          sessionRelease();
        }
      } else {
        sessionEnd();
      }
    }
  }

  async function getEncryptionKey() {
    const key = await watchUntilTruthy(encryptionKey);
    return key;
  }

  function markAuthenticated() {
    isSessionExpired = false;
    sessionExpiresAt = null;
    isAuthenticated.value = true;
  }

  function updateSessionExpiredFromDeadline() {
    if (sessionExpiresAt !== null && Date.now() >= sessionExpiresAt) {
      isSessionExpired = true;
    }
  }

  async function logout() {
    authEpoch += 1;
    setEncryptionKey(undefined);
    mnemonicDecrypted.value = '';
    isAuthenticated.value = false;
  }

  /**
   * Locks this window only, unlike `logout`: the shared session may already hold the key of
   * a password another window just set.
   */
  function invalidateLocalAuthentication() {
    authEpoch += 1;
    encryptionKey.value = undefined;
    mnemonicDecrypted.value = '';
    isAuthenticated.value = false;
    // The session times out as after a lock, unless a key is restored here.
    sessionRelease().catch(handleUnknownError);
  }

  /**
   * The stored mnemonic can't be decrypted on this device, or it or its key can't be read.
   * Reinstalling doesn't help on iOS (the Keychain survives it), so offer the in-app reset.
   * After a failed read (`isReadFailed`) reopening may help, so that is suggested first.
   */
  function surfaceUnreadableWalletData(error: unknown, { isReadFailed = false } = {}) {
    if (error instanceof VaultUnavailableError) {
      // Nothing is wrong with the data, so no reset is offered: it would fail or lose it.
      handleUnknownError(error);
      Logger.write({
        title: t('auth.walletStorageUnavailableTitle'),
        message: t('auth.walletStorageUnavailableMessage'),
        type: 'api-response',
        modal: false,
      });
      if (isUnreadableWalletModalOpen) return;
      isUnreadableWalletModalOpen = true;
      openConfirmModal({
        title: t('auth.walletStorageUnavailableTitle'),
        msg: t('auth.walletStorageUnavailableMessage'),
        icon: 'critical',
        buttonMessage: t('auth.walletStorageRetryAction'),
      })
        .then(() => window.location.reload())
        .catch(() => { /* NOOP - dismissed */ })
        .finally(() => {
          isUnreadableWalletModalOpen = false;
        });
      return;
    }
    let message = t('auth.walletDataUnreadableMessage');
    if (isReadFailed) {
      message = t('auth.walletDataReadFailedMessage');
    } else if (error instanceof MobileEncryptionKeyMissingError) {
      message = t('auth.walletKeyUnavailableMessage');
    }
    handleUnknownError(error);
    Logger.write({
      title: t('auth.walletDataUnreadableTitle'),
      message,
      type: 'api-response',
      modal: false,
    });
    // Every navigation re-runs `checkUserAuth`, so don't stack modals.
    if (isUnreadableWalletModalOpen) {
      return;
    }
    isUnreadableWalletModalOpen = true;
    openConfirmModal({
      title: t('auth.walletDataUnreadableTitle'),
      msg: message,
      icon: 'critical',
      buttonMessage: t('auth.walletDataUnreadableAction'),
    })
      .then(() => openModal(MODAL_RESET_WALLET))
      .catch(() => { /* NOOP - dismissed */ })
      .finally(() => {
        isUnreadableWalletModalOpen = false;
      });
  }

  /** A migrated secret isn't stored, and iOS may have deleted the original: offer to store it. */
  function surfaceMigrationWriteFailure() {
    // Moot while the wallet can't be read, whose modal it mustn't hide.
    if (isMigrationWriteModalOpen || isUnreadableWalletModalOpen) return;
    isMigrationWriteModalOpen = true;
    openConfirmModal({
      title: t('auth.walletDataSaveFailedTitle'),
      msg: t('auth.walletDataSaveFailedMessage'),
      icon: 'critical',
      buttonMessage: t('auth.walletStorageRetryAction'),
    })
      .then(
        async () => {
          try {
            await retryFailedMigrationWrites();
          } catch (retryError) {
            handleUnknownError(retryError); // Offered again at the next check.
          }
        },
        () => { /* NOOP - dismissed, offered again at the next check */ },
      )
      .finally(() => {
        isMigrationWriteModalOpen = false;
      });
  }

  /**
   * On iOS the seed read at startup can come back empty while it is still stored.
   * Writing a new one would replace it, so offer to reload and read it again.
   */
  async function assertNoUnloadedWalletStored() {
    if (mnemonic.value || !await SecureMobileStorage.get<string>(STORAGE_KEYS.mnemonic)) {
      return;
    }
    openConfirmModal({
      title: t('auth.storedWalletFoundTitle'),
      msg: t('auth.storedWalletFoundMessage'),
      buttonMessage: t('auth.storedWalletFoundAction'),
    })
      .then(() => window.location.reload())
      .catch(() => { /* NOOP - dismissed */ });
    throw new StoredWalletFoundError();
  }

  /**
   * The storage watcher doesn't wait for its write, so a failed Keychain write
   * would leave a wallet that looks created but is gone after a restart.
   */
  async function storeMobileMnemonic(ciphertext: string) {
    await SecureMobileStorage.set(STORAGE_KEYS.mnemonic, ciphertext);
    mnemonic.value = ciphertext;
  }

  /**
   * False once another window changed the password, even if the reactive salt follows it.
   */
  function isEncryptionKeyCurrent() {
    if (IS_MOBILE_APP) return true;
    const storedSalt = WalletStorage.get<string>(STORAGE_KEYS.encryptionSalt);
    return storedSalt === encryptionKeySalt;
  }

  /**
   * @param options.isDefaultPasswordSecret The password is the generated "skip password"
   * secret, stored in the same commit as the salt. Any other password removes it.
   * @param options.expectedVault The vault before asking for the password: a wallet created
   * or reset meanwhile isn't written over.
   * Web and extension only, mobile returns before the commit.
   */
  async function setPassword(
    password: string,
    plaintextToEncrypt = mnemonicDecrypted.value,
    {
      isDefaultPasswordSecret = false,
      expectedVault,
    }: { isDefaultPasswordSecret?: boolean; expectedVault?: VaultSnapshot } = {},
  ) {
    // Empty while the wallet is locked, and encrypting that would replace the seed.
    if (!plaintextToEncrypt) {
      throw new Error('The wallet is locked, there is no mnemonic to encrypt');
    }
    if (IS_MOBILE_APP) {
      /**
       * Mobile never uses a user/default password-derived PBKDF2 key for the
       * mnemonic. All sensitive mobile state is encrypted with the per-install
       * mobile data key; deriving and publishing a password key here would make
       * subsequent boots try to decrypt password ciphertext with the mobile key.
       */
      if (!encryptionKey.value) {
        const mobileKey = await getOrCreateMobileEncryptionKey();
        setEncryptionKey(mobileKey);
      }
      await storeMobileMnemonic(await encrypt(encryptionKey.value!, plaintextToEncrypt));
      markAuthenticated();
      return;
    }

    const currentKey = encryptionKey.value;
    await ensureVaultReady();
    await refreshVault();
    if (encryptionKey.value !== currentKey) {
      throw new Error('The wallet got locked while setting the password');
    }
    // From the vault: secrets whose views were never mounted rotate too.
    const previousVault = readVault();
    if (expectedVault && (
      previousVault.values[STORAGE_KEYS.mnemonic] !== expectedVault.values[STORAGE_KEYS.mnemonic]
      || previousVault.values[STORAGE_KEYS.encryptionSalt]
        !== expectedVault.values[STORAGE_KEYS.encryptionSalt]
      // A reset leaves an empty vault empty, but still ends what started before it.
      || (!expectedVault.values[STORAGE_KEYS.mnemonic]
        && previousVault.revision !== expectedVault.revision)
    )) {
      throw new VaultConflictError();
    }
    const currentSalt = encryptionSalt.value ? encodeBase64(encryptionSalt.value) : null;
    if (currentKey && !isEncryptionKeyCurrent()) {
      throw new Error('The password was changed in another window');
    }
    const newSalt = generateSalt();
    const newEncryptionKey = await generateEncryptionKey(password, newSalt);
    const newMnemonicCiphertext = await encrypt(newEncryptionKey, plaintextToEncrypt);

    // Every ciphertext is prepared before the storage or the key changes.
    const nextValues = { ...previousVault.values };
    await Promise.all(VAULT_SECRET_KEYS.map(async (storageKey) => {
      if (storageKey === STORAGE_KEYS.mnemonic) return;
      const ciphertext = previousVault.values[storageKey];
      if (!ciphertext) return;
      if (!currentKey) {
        throw new Error('The wallet is locked, its stored secrets cannot be re-encrypted');
      }
      const plaintext = await decrypt(currentKey, ciphertext).catch((error) => {
        // Maybe under an older password: kept, and the change refused.
        throw new VaultSecretUnreadableError(storageKey, previousVault, error);
      });
      nextValues[storageKey] = await encrypt(newEncryptionKey, plaintext);
    }));
    nextValues[STORAGE_KEYS.encryptionSalt] = encodeBase64(newSalt);
    nextValues[STORAGE_KEYS.mnemonic] = newMnemonicCiphertext;
    nextValues[STORAGE_KEYS.defaultPasswordSecret] = isDefaultPasswordSecret ? password : null;

    ownRotationSalt = nextValues[STORAGE_KEYS.encryptionSalt];
    try {
      const committed = await commitVault(previousVault, nextValues, () => {
        if (encryptionKey.value !== currentKey) {
          throw new Error('The wallet got locked while setting the password');
        }
        const latestSalt = encryptionSalt.value ? encodeBase64(encryptionSalt.value) : null;
        if (latestSalt !== currentSalt || (currentKey && !isEncryptionKeyCurrent())) {
          throw new Error('The password was changed in another window');
        }
      }, { requireLegacyReconciled: true });
      // Stored already: a failed read now mustn't report the change as failed.
      await refreshVault().catch(handleUnknownError);
      const latest = readVault();
      if (
        latest.values[STORAGE_KEYS.encryptionSalt]
          !== committed.values[STORAGE_KEYS.encryptionSalt]
        || latest.values[STORAGE_KEYS.mnemonic] !== committed.values[STORAGE_KEYS.mnemonic]
      ) {
        throw new Error('The password was changed again in another window');
      }
      // A lock while it settled still wins.
      if (encryptionKey.value !== currentKey) return;
      // Without a write, which could replace a newer commit of another window.
      getVaultRef(encryptionSalt)?.apply(committed.values[STORAGE_KEYS.encryptionSalt]);
      getVaultRef(mnemonic)?.apply(committed.values[STORAGE_KEYS.mnemonic]);
      setEncryptionKey(newEncryptionKey, { salt: committed.values[STORAGE_KEYS.encryptionSalt] });
      markAuthenticated();
    } finally {
      ownRotationSalt = null;
      // E.g. changed again in another window: the key kept here doesn't open it any more.
      // eslint-disable-next-line no-use-before-define
      if (encryptionKey.value && !isEncryptionKeyCurrent()) handleRemotePasswordChange();
    }
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
      setLoaderVisible(true);
      try {
        await assertNoUnloadedWalletStored();
        if (!encryptionKey.value) {
          const mobileKey = await getOrCreateMobileEncryptionKey();
          setEncryptionKey(mobileKey);
        }
        await storeMobileMnemonic(await encrypt(encryptionKey.value!, newMnemonic));
      } finally {
        setLoaderVisible(false);
      }
      if (await checkBiometricLoginAvailability()) {
        await openEnableBiometricLoginModal();
      }
    } else {
      const { openSetPasswordModal } = useModals();
      // Before the dialog: another window may create or reset a wallet while it is open.
      await ensureVaultReady();
      await refreshVault();
      const expectedVault = readVault();
      // Another window created or imported one: opened after a reload, not written over.
      if (!isRestored && expectedVault.values[STORAGE_KEYS.mnemonic]) {
        openConfirmModal({
          title: t('auth.storedWalletFoundTitle'),
          msg: t('auth.walletCreatedElsewhereMessage'),
          buttonMessage: t('auth.storedWalletFoundAction'),
        })
          .then(() => window.location.reload())
          .catch(() => { /* NOOP - dismissed */ });
        throw new StoredWalletFoundError();
      }
      const { password, isDefaultPasswordSecret } = await openSetPasswordModal(isRestored)
        .catch(() => {
          throw new Error(t('pages.index.passwordWasNotSet'));
        });
      await setPassword(password, newMnemonic, { isDefaultPasswordSecret, expectedVault });
      isUsingDefaultPassword.value = isDefaultPasswordSecret;
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
    markAuthenticated();
  }

  /** `null`: the vault changed meanwhile, so nothing was published. */
  async function attemptSessionKeyRestore({
    isSessionConfirmed = false,
    setAuthenticated = false,
  }: { isSessionConfirmed?: boolean; setAuthenticated?: boolean }): Promise<boolean | null> {
    const epoch = authEpoch;
    await ensureVaultReady();
    await refreshVault();
    const vault = readVault();
    const salt = vault.values[STORAGE_KEYS.encryptionSalt];
    const ciphertext = vault.values[STORAGE_KEYS.mnemonic];
    const currentKey = encryptionKey.value;
    const sessionEncryptionKey = await getSessionEncryptionKey();
    if (!sessionEncryptionKey || !ciphertext || validateMnemonic(ciphertext, wordlist)) {
      return false;
    }
    async function isVaultUnchanged() {
      await refreshVault();
      const { values } = readVault();
      return values[STORAGE_KEYS.encryptionSalt] === salt
        && values[STORAGE_KEYS.mnemonic] === ciphertext;
    }
    let plaintext: string;
    try {
      plaintext = await decrypt(sessionEncryptionKey, ciphertext);
    } catch (error) {
      // Read before another window's commit, e.g. a password change: tried again with it.
      if (!await isVaultUnchanged()) return null;
      // E.g. a password change cut off before the session write: only that outdated key goes.
      if (isSessionConfirmed && authEpoch === epoch) {
        await sessionEndIfHolding(sessionEncryptionKey).catch(handleUnknownError);
      }
      throw error;
    }
    // Keep our object for the same key: `decryptedComputed` takes a new one for a rotation.
    const isKeyUnchanged = !!currentKey && await decrypt(
      currentKey,
      ciphertext,
    ).then(() => true, () => false);
    // Nothing is published once the vault, or a lock or login here, overtook it.
    if (!await isVaultUnchanged()) return null;
    if (authEpoch !== epoch) return !!encryptionKey.value;
    if (isSessionConfirmed) {
      const storedKey = await getSessionEncryptionKey();
      if (!storedKey || !await isSameEncryptionKey(storedKey, sessionEncryptionKey)) {
        return !!encryptionKey.value;
      }
      if (!await isVaultUnchanged()) return null;
      if (authEpoch !== epoch) return !!encryptionKey.value;
    }
    if (!isKeyUnchanged) {
      // The salt read with the ciphertext, not one a storage event brought meanwhile.
      setEncryptionKey(sessionEncryptionKey, { isFromSession: true, salt });
    } else {
      encryptionKeySalt = salt;
    }
    mnemonicDecrypted.value = plaintext;
    if (setAuthenticated) markAuthenticated();
    return true;
  }

  /**
   * Publishes the session key once it opens the stored mnemonic, unless a password change,
   * reset, lock or login overtook it. Never ends a session another window stored meanwhile.
   * @param options.isSessionConfirmed Re-reads the session first: a page stores the key it
   * publishes, which mustn't restore a session another window ended (a lock).
   * @returns Whether this window has a key afterwards.
   */
  async function restoreSessionKey(
    options: { isSessionConfirmed?: boolean; setAuthenticated?: boolean } = {},
  ): Promise<boolean> {
    for (let attempt = 1; ; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop
      const result = await attemptSessionKeyRestore(options);
      if (result !== null) return result;
      // Overtaken by a commit, maybe the awaited one: try again unless the key here is current.
      if ((encryptionKey.value && isEncryptionKeyCurrent()) || attempt >= 3) {
        return !!encryptionKey.value;
      }
    }
  }

  async function restoreEncryptionKeyFromBackground(): Promise<boolean> {
    try {
      return await restoreSessionKey();
    } catch (error) {
      handleUnknownError(error);
      return false;
    }
  }

  let backgroundEncryptionKeySync: Promise<void> | null = null;
  let backgroundEncryptionKeySyncDeadline = 0;
  let isBackgroundEncryptionKeySyncRequested = false;
  let wakeBackgroundEncryptionKeySync: (() => void) | undefined;

  function waitForNextBackgroundEncryptionKeyAttempt(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      wakeBackgroundEncryptionKeySync = () => {
        clearTimeout(timer);
        resolve();
      };
    });
  }

  async function pollBackgroundEncryptionKey() {
    try {
      for (;;) {
        isBackgroundEncryptionKeySyncRequested = false;
        // eslint-disable-next-line no-await-in-loop
        const isRestored = await restoreEncryptionKeyFromBackground();
        // Requested again during the attempt (e.g. a new key): retry right away.
        if (!isBackgroundEncryptionKeySyncRequested) {
          if (isRestored) {
            return;
          }
          const remaining = backgroundEncryptionKeySyncDeadline - performance.now();
          if (remaining <= 0) {
            return;
          }
          // eslint-disable-next-line no-await-in-loop
          await waitForNextBackgroundEncryptionKeyAttempt(
            Math.min(CHECK_FOR_SESSION_KEY_INTERVAL, remaining),
          );
          wakeBackgroundEncryptionKeySync = undefined;
        }
      }
    } finally {
      // In the tick the loop ends, so no request joins a finished loop.
      backgroundEncryptionKeySync = null;
    }
  }

  /**
   * Offscreen tab only: polls the background for the session key until
   * `CHECK_FOR_SESSION_KEY_TIMEOUT` after the latest call, which also triggers an attempt.
   */
  function syncBackgroundEncryptionKey(): Promise<void> {
    backgroundEncryptionKeySyncDeadline = performance.now() + CHECK_FOR_SESSION_KEY_TIMEOUT;
    isBackgroundEncryptionKeySyncRequested = true;
    wakeBackgroundEncryptionKeySync?.();
    if (!backgroundEncryptionKeySync) {
      backgroundEncryptionKeySync = pollBackgroundEncryptionKey();
    }
    return backgroundEncryptionKeySync;
  }

  async function authenticateWithPassword(password: string): Promise<boolean> {
    // Decided before the reads: an unlock meanwhile says nothing about this password.
    if (isAuthenticated.value) return true;
    if (!IS_MOBILE_APP) {
      await ensureVaultReady();
      await watchUntilTruthy(isMnemonicRestored);
      await refreshVault();
    }
    if (!isMnemonicEncrypted.value) return true;
    const previousVault = IS_MOBILE_APP ? null : readVault();
    const salt = previousVault
      ? previousVault.values[STORAGE_KEYS.encryptionSalt]
      : encryptionSalt.value && encodeBase64(encryptionSalt.value);
    const ciphertext = previousVault
      ? previousVault.values[STORAGE_KEYS.mnemonic]
      : mnemonicEncrypted.value;
    const currentKey = encryptionKey.value;
    if (!salt || !ciphertext) return false;
    const key = await generateEncryptionKey(password, decodeBase64(salt));
    const decryptionResult = await decrypt(key, ciphertext);
    if (!decryptionResult) {
      return false;
    }
    if (previousVault) await refreshVault();
    const currentVault = previousVault ? readVault() : null;
    if (currentVault && (
      currentVault.values[STORAGE_KEYS.encryptionSalt] !== salt
      || currentVault.values[STORAGE_KEYS.mnemonic] !== ciphertext
    )) {
      throw new Error('The password was changed while unlocking the wallet');
    }
    // Unlocked meanwhile, e.g. from the session: the password opens it too, nothing is replaced.
    if (isAuthenticated.value) return true;
    if (encryptionKey.value !== currentKey) {
      throw new Error('The password was changed while unlocking the wallet');
    }
    setEncryptionKey(key, { salt });
    mnemonicDecrypted.value = decryptionResult;
    markAuthenticated();
    return true;
  }

  async function authenticateWithBiometry(
    force = false,
    { setAuthenticated = true }: { setAuthenticated?: boolean } = {},
  ): Promise<boolean> {
    biometricPromptsOpen += 1;
    try {
      if (
        (
          !isAuthenticated.value
          || force
        )
        && (isBiometricLoginEnabled.value || force)
        && await canAuthenticateWithDevice()
      ) {
        await BiometricAuth.authenticate({
          reason: t('biometricAuth.reason'),
          cancelTitle: t('common.cancel'),
          allowDeviceCredential: true,
          iosFallbackTitle: t('biometricAuth.fallbackTitle'),
          androidTitle: t('biometricAuth.title'),
          androidSubtitle: t('biometricAuth.subtitle'),
          androidConfirmationRequired: false,
        });
        if (setAuthenticated) {
          markAuthenticated();
        }
      }
      return true;
    } finally {
      biometricPromptsOpen -= 1;
    }
  }

  /**
   * The lock screen prompts without a tap once each time the app is shown, only while it is
   * shown and no other prompt is open. A `true` uses up that turn.
   */
  function claimLockScreenAutoPrompt() {
    if (!isAppActive.value || biometricPromptsOpen || !canLockScreenAutoPrompt) {
      return false;
    }
    canLockScreenAutoPrompt = false;
    return true;
  }

  /**
   * Open biometric login or password login modal depending on the environment settings.
   * The modals then uses one of the `authenticateWithPassword`
   * or `authenticateWithBiometry` methods.
   */
  async function checkUserAuth(): Promise<any> {
    await watchUntilTruthy(isMnemonicRestored);
    if (isMnemonicUnreadable.value) {
      surfaceUnreadableWalletData(mnemonicReadError, { isReadFailed: true });
      return;
    }
    if (hasFailedMigrationWrites()) {
      surfaceMigrationWriteFailure();
    }
    updateSessionExpiredFromDeadline();

    if (
      IS_MOBILE_APP
      && mnemonic.value
      && isAuthenticated.value
      && isSessionExpired
      && isAutoLockEnabled.value
    ) {
      isManualMobileLockActive = true;
      await logout();
    }

    if (!mnemonic.value || isAuthenticated.value) {
      return;
    }
    if (isAuthenticating.value) {
      await watchUntilTruthy(() => !isAuthenticating.value || isAuthenticated.value);
      return;
    }

    isUsingDefaultPassword.value = false;
    isAuthenticating.value = true;

    try {
      if (IS_MOBILE_APP) {
        /**
         * Mobile state is now AES-GCM encrypted with the per-install
         * mobile key. Load the key before the biometric gate, but do not
         * publish the decrypted mnemonic until the gate has succeeded.
         */
        if (!encryptionKey.value) {
          try {
            const mobileKey = await getMobileEncryptionKey();
            setEncryptionKey(mobileKey);
          } catch (error) {
            if (!(error instanceof MobileEncryptionKeyMissingError)) {
              throw error;
            }
            surfaceUnreadableWalletData(error);
            return;
          }
        }
        if (
          (isBiometricLoginEnabled.value || isManualMobileLockActive)
          && await canAuthenticateWithDevice()
        ) {
          try {
            await openBiometricLoginModal({
              force: isManualMobileLockActive,
              deferAuthStateUpdate: true,
              isLockScreen: true,
            });
            isManualMobileLockActive = false;
          } catch {
            // User dismissed or failed the biometric prompt; keep the wallet locked.
            mnemonicDecrypted.value = '';
            return;
          }
        } else if (isManualMobileLockActive) {
          isManualMobileLockActive = false;
        }
        if (isMnemonicEncrypted.value) {
          try {
            const decryptedMnemonic = await decrypt(encryptionKey.value!, mnemonic.value);
            if (!decryptedMnemonic) {
              return;
            }
            mnemonicDecrypted.value = decryptedMnemonic;
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
             * path forward. Surface the failure explicitly and bail
             * without authenticating — the outer `finally` clears
             * `isAuthenticating`.
             */
            surfaceUnreadableWalletData(error);
            return;
          }
        } else {
          mnemonicDecrypted.value = mnemonic.value;
        }
        markAuthenticated();
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
         * A failed attempt publishes no key, so a key another path published
         * meanwhile (e.g. from the session) is kept.
         */
        if (!encryptionKey.value && !autoLoginDisabledEnv) {
          const tryDefaultPassword = async (candidate: string): Promise<boolean> => {
            try {
              const ok = await authenticateWithPassword(candidate);
              if (ok && isAuthenticated.value) {
                return true;
              }
            } catch { /* NOOP — wrong candidate, fall through */ }
            return false;
          };

          let storedSecret: string | null;
          try {
            storedSecret = await getDefaultPasswordSecret();
          } catch (error) {
            surfaceUnreadableWalletData(error);
            return;
          }
          if (storedSecret && await tryDefaultPassword(storedSecret)) {
            isUsingDefaultPassword.value = true;
          }

          if (!isAuthenticated.value && await tryDefaultPassword(LEGACY_DEFAULT_PASSWORD)) {
            isUsingDefaultPassword.value = true;
            /**
             * Transparently rotate legacy "skip password" installs off the
             * hardcoded `testPassword123` sentinel the moment we unlock
             * with it. We mint a new per-install 256-bit random secret and
             * hand it to `setPassword`, which:
             *   - generates a fresh `encryptionSalt`,
             *   - re-encrypts every stored secret under the new key,
             *   - stores them with the secret and the salt in one commit,
             *     so a popup and a side panel rotating at once can't mix them.
             * After this runs the on-disk state no longer depends on any
             * value shipped in source, and subsequent launches take the
             * `storedSecret` branch above.
             */
            try {
              await setPassword(generateDefaultPasswordSecret(), undefined, {
                isDefaultPasswordSecret: true,
              });
            } catch (error) {
              // Rotation is best-effort — a failure here still leaves the
              // user authenticated under the legacy password, matching
              // pre-fix behavior, and the next successful login will retry.
              handleUnknownError(error);
              // Unless another window rotated first, which locked this one: its secret opens it.
              const rotatedSecret = !encryptionKey.value && await getDefaultPasswordSecret();
              if (rotatedSecret && await tryDefaultPassword(rotatedSecret)) {
                isUsingDefaultPassword.value = true;
              }
            }
          }
        }

        // If default password auth failed, check if extension can be restored
        // by using data stored in the background process.
        if (!encryptionKey.value && !autoLoginDisabledEnv && IS_EXTENSION) {
          setLoaderVisible(true);
          try {
            // A key that can't open the mnemonic isn't published, and the stale one is dropped.
            await restoreSessionKey({ isSessionConfirmed: true, setAuthenticated: true });
          } catch (error) {
            // Stale key, e.g. a password change cut off before the session write.
            handleUnknownError(error);
          } finally {
            setLoaderVisible(false);
          }
        }

        // Finally if other attempts failed, ask user for the password.
        if (!encryptionKey.value) {
          await openPasswordLoginModal();
        }
      } else if (!isMnemonicEncrypted.value) {
        // Migrate the unprotected mnemonic by forcing user to set the password and encrypt it
        await setMnemonicAndInitializeAuthentication(mnemonic.value, true);
      }
    } finally {
      isAuthenticating.value = false;
    }
  }

  /**
   * @param options.isUserInitiated The user locked it, so the lock screen waits until the app
   * is shown again before prompting, or Face ID would unlock it right away.
   */
  async function lockWallet({ isUserInitiated = false }: { isUserInitiated?: boolean } = {}) {
    if (IS_MOBILE_APP) {
      isManualMobileLockActive = true;
    }
    if (isUserInitiated) {
      canLockScreenAutoPrompt = false;
    }
    logout();
    await checkUserAuth();
  }

  let remotePasswordChange: Promise<void> | null = null;

  /**
   * Another window changed the password or reset the wallet, so the key here opens nothing.
   * Locked, so its decrypt failures don't look like lost data, until the new key arrives:
   * from the session on the extension, else the password is asked.
   */
  function handleRemotePasswordChange() {
    invalidateLocalAuthentication();
    if (IS_OFFSCREEN_TAB) {
      syncBackgroundEncryptionKey();
      return;
    }
    if (remotePasswordChange) return;
    remotePasswordChange = (async () => {
      if (IS_EXTENSION) {
        const deadline = performance.now() + REMOTE_PASSWORD_CHANGE_SESSION_WAIT;
        for (;;) {
          // eslint-disable-next-line no-await-in-loop
          const isRestored = await restoreSessionKey({
            isSessionConfirmed: true,
            setAuthenticated: true,
          }).catch(() => false);
          if (isRestored || performance.now() >= deadline) break;
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => {
            setTimeout(resolve, REMOTE_PASSWORD_CHANGE_SESSION_INTERVAL);
          });
        }
      }
      if (!encryptionKey.value) await checkUserAuth();
    })()
      .catch(handleUnknownError)
      .finally(() => {
        remotePasswordChange = null;
      });
  }

  if (!IS_MOBILE_APP) {
    // Synchronous, so watchers see the lock rather than the new ciphertext under the old key.
    subscribeVault(({ values }) => {
      const storedSalt = values[STORAGE_KEYS.encryptionSalt];
      if (
        encryptionKey.value
        && storedSalt !== encryptionKeySalt
        // No salt: the wallet was reset, never this window's own rotation.
        && (storedSalt === null || storedSalt !== ownRotationSalt)
      ) {
        // That window's `setPassword` stored the secret, or its removal, with the salt.
        isUsingDefaultPassword.value = !!values[STORAGE_KEYS.defaultPasswordSecret];
        handleRemotePasswordChange();
      }
    });
  }

  /**
   * Removes the secret a `VaultSecretUnreadableError` named, once the user agreed: only from
   * that vault, and only while the key still can't read it.
   */
  async function removeUnreadableSecret(storageKey: VaultKey, expectedVault: VaultSnapshot) {
    const key = encryptionKey.value;
    const { values } = expectedVault;
    const ciphertext = values[storageKey];
    if (
      IS_MOBILE_APP
      || !key
      || !values[STORAGE_KEYS.mnemonic]
      || values[STORAGE_KEYS.encryptionSalt] !== encryptionKeySalt
    ) {
      throw new Error('The wallet is locked or its password was changed');
    }
    await decrypt(key, values[STORAGE_KEYS.mnemonic]!);
    if (!ciphertext || await decrypt(key, ciphertext).then(() => true, () => false)) return;
    // Fails if anything changed since, e.g. a new password stored by another window.
    await commitVault(expectedVault, { ...values, [storageKey]: null }, () => {
      if (encryptionKey.value !== key) {
        throw new Error('The wallet got locked while removing the data');
      }
    });
  }

  /**
   * Check if password provided by user is correct and if true update it to new one.
   */
  async function updatePassword(currentPassword: string, newPassword: string) {
    // E.g. locked by a password change in another window: there is no seed to encrypt.
    if (!encryptionKey.value) throw new Error('The wallet is locked');
    if (!IS_MOBILE_APP) await refreshVault();
    if (encryptionKey.value && !isEncryptionKeyCurrent()) {
      throw new Error('The password was changed in another window');
    }
    const key = await generateEncryptionKey(currentPassword, encryptionSalt.value!);
    await decrypt(key, mnemonicEncrypted.value!).catch(() => {
      throw new WrongPasswordError();
    });
    await setPassword(newPassword);
  }

  /**
   * Older versions kept the seed in plaintext in the browser storage. It goes only once
   * the stored ciphertext opens to the same seed, so it is never the only readable copy.
   */
  async function removeLegacyPlaintextSeed() {
    const key = encryptionKey.value;
    const unlockedMnemonic = mnemonicDecrypted.value;
    const seedHex = Buffer.from(mnemonicSeed.value!).toString('hex');
    const isUnlockedMnemonic = (value: unknown) => value === unlockedMnemonic;
    const isUnlockedAccount = (value: any) => value?.privateKey === seedHex;
    await removeLegacySecrets({
      stateFields: { mnemonic: isUnlockedMnemonic, account: isUnlockedAccount },
      entries: { mnemonic: isUnlockedMnemonic, userAccount: isUnlockedAccount },
      confirm: async () => {
        const storage = (IS_MOBILE_APP) ? SecureMobileStorage : WalletStorage;
        const stored = await storage.get<string>(STORAGE_KEYS.mnemonic);
        return !!key && !!stored
          && await decrypt(key, stored).catch(() => null) === unlockedMnemonic;
      },
    });
  }

  (async () => {
    checkBiometricLoginAvailability();

    /**
     * Load the per-install mobile encryption key as soon as the
     * composable boots so `decryptedComputed` watchers (in `accounts.ts`,
     * `aeNames.ts`, and for `secureLoginTimeout` above) have a real
     * `encryptionKey` to work against — on mobile we now encrypt those
     * blobs instead of passing them through plaintext via the old
     * `IS_MOBILE_APP` bypass. This read never creates a key: empty key and
     * mnemonic reads must not be mistaken for a new installation. Explicit
     * creation and legacy plaintext migration share the same key cache.
     */
    if (IS_MOBILE_APP && !encryptionKey.value) {
      try {
        const mobileKey = await getMobileEncryptionKey();
        setEncryptionKey(mobileKey);
      } catch (error) {
        // Reported by `checkUserAuth`.
        if (!(error instanceof MobileEncryptionKeyMissingError)) {
          throw error;
        }
      }
    }

    await watchUntilTruthy(() => mnemonic.value);

    if (!isMnemonicEncrypted.value && !IS_MOBILE_APP) {
      mnemonicDecrypted.value = mnemonic.value;
    }

    if (!encryptionKey.value && IS_EXTENSION) {
      await checkUserAuth(); // Check auth when opening again the extension
    }
  })();

  if (IS_OFFSCREEN_TAB) {
    // Later logins sync through the `CONNECTION_TYPES.SESSION` port (`offscreen/wallet.ts`).
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
    () => isAuthenticated.value && isMnemonicEncrypted.value && !!mnemonicDecrypted.value,
    (isUnlocked) => {
      if (isUnlocked) {
        removeLegacyPlaintextSeed().catch(handleUnknownError);
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
        updateSessionExpiredFromDeadline();
        sessionExpiresAt = null;
        // Before checking the key, so the background can't time it out after the check.
        if (isAuthenticated.value && !isSessionExpired && isSessionKeepingPage()) {
          sessionHold();
        }

        // If session exists user needs to stay logged in
        if (!isAuthenticating.value) {
          const keepExtensionLoggedIn = !!(await getSessionEncryptionKey());
          if (
            (isSessionExpired && isAutoLockEnabled.value)
            || (!keepExtensionLoggedIn && IS_EXTENSION)
          ) {
            lockWallet();
          }
        }
      } else if (wasActive && !isActive) {
        // A prompt can hide the app itself (Android's passcode screen), so then it waits for a tap.
        canLockScreenAutoPrompt = !biometricPromptsOpen;
        // Once no page is shown, the background times the session out with the current timeout.
        sessionRelease();
        if (!isAutoLockEnabled.value) {
          isSessionExpired = false;
          sessionExpiresAt = null;
          return;
        }
        const expirationTimeoutMs = +secureLoginTimeoutDecrypted.value!;
        sessionExpiresAt = Date.now() + expirationTimeoutMs;
        if (expirationTimeoutMs <= 0) {
          isSessionExpired = true;
          return;
        }
        expirationTimeout = setTimeout(
          () => {
            isSessionExpired = true;
          },
          expirationTimeoutMs,
        );
      }
    },
  );

  return {
    isAuthenticated: readonly(isAuthenticated),
    isMnemonicRestored,
    isMnemonicEncrypted,
    isMnemonicUnreadable,
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
    canAuthenticateWithDevice,
    checkBiometricLoginAvailability,
    checkUserAuth,
    claimLockScreenAutoPrompt,
    getEncryptionKey,
    isEncryptionKeyCurrent,
    lockWallet,
    logout,
    removeUnreadableSecret,
    setMnemonicAndInitializeAuthentication,
    setPassword,
    syncBackgroundEncryptionKey,
    updatePassword,
  };
});
