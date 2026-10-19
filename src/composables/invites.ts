import { computed, ref, watch } from 'vue';
import {
  AE_AMOUNT_FORMATS,
  Encoded,
} from '@aeternity/aepp-sdk';
import type { AccountAddress, IInvite, IInviteSerialized } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { tg } from '@/popup/plugins/i18n';
import { getAccountFromSecret } from '@/protocols/aeternity/helpers';
import { WalletStorage } from '@/lib/WalletStorage';
import {
  createCustomScopedComposable,
  decrypt,
  encrypt,
  handleUnknownError,
} from '@/utils';
import migrateInvitesVuexToComposable from '@/migrations/006-invites-vuex-to-composable';
import { removeLegacySecrets } from '@/migrations/migrationHelpers';
import { useModals } from './modals';
import { useAeSdk } from './aeSdk';
import { useAuth } from './auth';

const parseInvites = (invites: IInviteSerialized[]): IInvite[] => invites
  // TODO: remove `as any` after updating `Buffer.from` type
  .map(({ secretKey, ...item }) => ({ ...item, secretKey: Buffer.from(secretKey as any) }));

const serializeInvites = (invites: IInvite[]): IInviteSerialized[] => invites
  .map(({ secretKey, ...item }) => ({ ...item, secretKey: secretKey.toJSON() }));

const isSameKey = (a: Buffer, b: Buffer) => (
  Buffer.from(a).toString('hex') === Buffer.from(b).toString('hex')
);

/**
 * The invite keys hold the funds sent to the invites, so they are stored encrypted.
 * While the wallet is locked there are no invites and none can be stored.
 * Not in the secure storage on mobile: on iOS a failed Keychain read comes back empty,
 * and the next invite would replace the stored ones. The key stays in the Keychain.
 * Read from the storage before each change, as other windows store invites too.
 */
const useInvitesStorage = createCustomScopedComposable(() => {
  const { encryptionKey, isEncryptionKeyCurrent } = useAuth();

  const invites = ref<IInvite[]>([]);

  let queue = Promise.resolve();

  function enqueue(task: () => Promise<void>) {
    const result = queue.then(task);
    queue = result.catch(() => {});
    return result;
  }

  // The stored salt no longer derives this key: invites stored under it could never be read.
  function checkKeyIsCurrent() {
    if (!isEncryptionKeyCurrent()) {
      throw new Error('The password was changed in another window');
    }
  }

  /** Keeps the objects of the invites shown already, so that their items don't reload. */
  function showInvites(updatedInvites: IInvite[]) {
    invites.value = updatedInvites.map((invite) => (
      invites.value.find(({ secretKey }) => isSameKey(secretKey, invite.secretKey)) || invite
    ));
  }

  async function readInvites(key: CryptoKey): Promise<IInvite[]> {
    checkKeyIsCurrent();
    const ciphertext = WalletStorage.get<string>(STORAGE_KEYS.invitesEncrypted);
    if (!ciphertext) {
      return [];
    }
    try {
      return parseInvites(JSON.parse(await decrypt(key, ciphertext)));
    } catch {
      throw new Error('The stored invites are unreadable');
    }
  }

  /** A lock meanwhile doesn't stop it: the stored salt still derives the key. */
  async function storeInvites(key: CryptoKey, updatedInvites: IInvite[]) {
    const ciphertext = await encrypt(key, JSON.stringify(serializeInvites(updatedInvites)));
    if (encryptionKey.value && encryptionKey.value !== key) {
      throw new Error('The password changed while storing the invites');
    }
    checkKeyIsCurrent();
    WalletStorage.set(STORAGE_KEYS.invitesEncrypted, ciphertext);
    if (encryptionKey.value === key) {
      showInvites(updatedInvites);
    }
  }

  /** Resolves once the updated invites are stored. */
  function updateInvites(update: (currentInvites: IInvite[]) => IInvite[]) {
    return enqueue(async () => {
      const key = encryptionKey.value;
      if (!key) {
        throw new Error('The invites can\'t be stored while the wallet is locked');
      }
      await storeInvites(key, update(await readInvites(key)));
    });
  }

  /**
   * Older versions stored the invites in plaintext. The plaintext goes only once the
   * stored ciphertext has them all, so a crash in between loses none.
   */
  async function moveLegacyInvites(key: CryptoKey) {
    const plaintextInvites = WalletStorage.get<IInviteSerialized[]>(STORAGE_KEYS.invites);
    // Moved already, maybe by another window: the Vuex state read here may be outdated.
    if (!plaintextInvites && WalletStorage.get(STORAGE_KEYS.invitesEncrypted)) {
      // A move cut off before removing it, or another page writing the state back, left it.
      await removeLegacySecrets({ stateFields: { invites: () => true } });
      return;
    }
    const legacyInvites = await migrateInvitesVuexToComposable(plaintextInvites);
    if (!legacyInvites) {
      return;
    }
    const parsedLegacyInvites = parseInvites(legacyInvites);
    const storedInvites = await readInvites(key);
    const missingInvites = parsedLegacyInvites.filter(({ secretKey }) => (
      !storedInvites.some((invite) => isSameKey(invite.secretKey, secretKey))
    ));
    if (missingInvites.length) {
      await storeInvites(key, [...storedInvites, ...missingInvites]);
    }
    // Read again, as another window may have stored its invites meanwhile.
    const movedInvites = await readInvites(key);
    if (parsedLegacyInvites.every(({ secretKey }) => (
      movedInvites.some((invite) => isSameKey(invite.secretKey, secretKey))
    ))) {
      // The Vuex copy first: if the other one stays, it is the one the next run reads.
      await removeLegacySecrets({ stateFields: { invites: () => true } });
      WalletStorage.remove(STORAGE_KEYS.invites);
    }
  }

  watch(encryptionKey, (key, previousKey) => {
    if (!key) {
      invites.value = [];
      return;
    }
    enqueue(async () => {
      let storedInvites: IInvite[];
      try {
        storedInvites = await readInvites(key);
      } catch (error) {
        // The password changed here: the invites are still under the previous key.
        if (!previousKey) {
          throw error;
        }
        storedInvites = await readInvites(previousKey);
        await storeInvites(key, storedInvites);
      }
      if (encryptionKey.value === key) {
        showInvites(storedInvites);
        await moveLegacyInvites(key);
      }
    }).catch(handleUnknownError);
  }, { immediate: true });

  return {
    invites: computed(() => invites.value),
    updateInvites,
  };
});

export function useInvites() {
  const { getDryAeSdk } = useAeSdk();
  const { openDefaultModal } = useModals();
  const { invites, updateInvites } = useInvitesStorage();

  /** Resolves once the invite is stored, so its funds can be sent. */
  function addInvite(secretKey: Buffer) {
    return updateInvites((currentInvites) => [
      { secretKey, createdAt: Date.now() },
      ...currentInvites,
    ]);
  }

  /** Best effort: when it can't be stored, the invite stays. */
  function removeInvite(secretKey: Buffer) {
    return updateInvites((currentInvites) => currentInvites
      .filter((invite) => !isSameKey(invite.secretKey, secretKey)))
      .catch(handleUnknownError);
  }

  async function claimInvite({
    secretKey,
    recipientId,
    amount = '0',
    isMax = false,
  }: { secretKey: Buffer; recipientId: AccountAddress; amount?: string; isMax: boolean }) {
    const dryAeSdk = await getDryAeSdk();
    if (!isMax) {
      await dryAeSdk.spend(
        amount,
        recipientId as Encoded.AccountAddress,
        {
          denomination: AE_AMOUNT_FORMATS.AE,
          onAccount: getAccountFromSecret(secretKey),
        },
      );
    } else {
      await dryAeSdk.transferFunds(
        1, // Decimal percentage, 1 = 100%
        recipientId as Encoded.AccountAddress,
        { onAccount: getAccountFromSecret(secretKey) },
      );
    }
  }

  async function handleInsufficientBalanceError(error: Error, isInviteError = false) {
    if (
      (!isInviteError && !error.message.includes('is not enough to execute'))
      || (isInviteError && !error.message.includes('Transaction build error'))
    ) {
      return false;
    }

    await openDefaultModal({
      msg: (isInviteError)
        ? tg('pages.invite.insufficient-invite-balance')
        : tg('pages.invite.insufficient-balance'),
    });
    return true;
  }

  return {
    invites,
    addInvite,
    removeInvite,
    claimInvite,
    handleInsufficientBalanceError,
  };
}
