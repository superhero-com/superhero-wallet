import {
  AE_AMOUNT_FORMATS,
  AeSdk,
  Encoded,
  Node,
} from '@aeternity/aepp-sdk';
import type { IInvite } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { tg } from '@/popup/plugins/i18n';
import { getAccountFromSecret } from '@/protocols/aeternity/helpers';
import migrateInvitesVuexToComposable from '@/migrations/006-invites-vuex-to-composable';
import { useStorageRef } from './storageRef';
import { useModals } from './modals';
import { useNetworks } from './networks';

const invites = useStorageRef<IInvite[]>(
  [],
  STORAGE_KEYS.invites,
  {
    migrations: [
      migrateInvitesVuexToComposable,
    ],
  },
);

export function useInvites() {
  const { activeNetwork } = useNetworks();
  const { openDefaultModal } = useModals();

  function addInvite(secretKey: Buffer) {
    invites.value.unshift({
      secretKey: secretKey.toJSON(),
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
  }: { secretKey: Buffer; recipientId: Encoded.AccountAddress; amount?: string; isMax: boolean }) {
    const aeSdk = new AeSdk({
      nodes: [{
        name: activeNetwork.value.name,
        instance: new Node(activeNetwork.value.protocols.aeternity.nodeUrl),
      }],
      accounts: [getAccountFromSecret(secretKey)],
    });
    if (!isMax) {
      await aeSdk.spend(
        amount,
        recipientId,
        // @ts-ignore
        { denomination: AE_AMOUNT_FORMATS.AE },
      );
    } else {
      await aeSdk.transferFunds(
        1, // Decimal percentage, 1 = 100%
        recipientId,
        { verify: false },
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
