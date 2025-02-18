import {
  AE_AMOUNT_FORMATS,
  Encoded,
} from '@aeternity/aepp-sdk';
import type { AccountAddress, IInvite, IInviteSerialized } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { tg } from '@/popup/plugins/i18n';
import { getAccountFromSecret } from '@/protocols/aeternity/helpers';
import migrateInvitesVuexToComposable from '@/migrations/006-invites-vuex-to-composable';
import { useStorageRef } from './storageRef';
import { useModals } from './modals';
import { useAeSdk } from './aeSdk';

const invites = useStorageRef<IInvite[], IInviteSerialized[]>(
  [],
  STORAGE_KEYS.invites,
  {
    migrations: [
      migrateInvitesVuexToComposable,
    ],
    serializer: {
      read: (arr) => arr
        // TODO: remove `as any` after updating `Buffer.from` type
        .map(({ secretKey, ...item }) => ({ ...item, secretKey: Buffer.from(secretKey as any) })),
      write: (arr) => arr
        .map(({ secretKey, ...item }) => ({ ...item, secretKey: secretKey.toJSON() })),
    },
  },
);

export function useInvites() {
  const { getDryAeSdk } = useAeSdk();
  const { openDefaultModal } = useModals();

  function addInvite(secretKey: Buffer) {
    invites.value.unshift({
      secretKey,
      createdAt: Date.now(),
    });
  }

  function removeInvite(secretKey: Buffer) {
    invites.value = invites.value.filter((invite) => invite.secretKey !== secretKey);
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
