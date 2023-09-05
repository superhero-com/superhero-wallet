import { AeSdk, AE_AMOUNT_FORMATS, Node } from '@aeternity/aepp-sdk';
import { useModals, useNetworks } from '@/composables';
import { getAccountFromSecret } from '@/protocols/aeternity/helpers';
import { tg } from '../plugins/languages';

export default {
  namespaced: true,
  state: {
    invites: [],
  },
  mutations: {
    add: ({ invites }, secretKey) => invites.unshift({
      secretKey: secretKey.toJSON(),
      createdAt: Date.now(),
    }),
    delete(state, secretKey) {
      state.invites = state.invites.filter((invite) => invite.secretKey !== secretKey);
    },
  },
  actions: {
    async claim(_, {
      secretKey,
      recipientId,
      amount = undefined,
      isMax,
    }) {
      const { activeNetwork } = useNetworks();
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
          { denomination: AE_AMOUNT_FORMATS.AE },
        );
      } else {
        await aeSdk.transferFunds(
          1,
          recipientId,
          { verify: false },
        );
      }
    },
    async handleNotEnoughFoundsError(_, { error: { message }, isInviteError = false }) {
      if (!isInviteError && !message.includes('is not enough to execute')) return false;
      if (isInviteError && !message.includes('Transaction build error')) return false;

      const { openDefaultModal } = useModals();
      await openDefaultModal({
        msg: isInviteError
          ? tg('pages.invite.insufficient-invite-balance')
          : tg('pages.invite.insufficient-balance'),
      });
      return true;
    },
  },
};
