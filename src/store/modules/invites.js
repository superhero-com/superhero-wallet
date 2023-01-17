import { AeSdk, MemoryAccount, Node } from '@aeternity/aepp-sdk';
import { i18n } from '../plugins/languages';

export default {
  namespaced: true,
  state: {
    invites: [],
  },
  mutations: {
    add: ({ invites }, secretKey) => invites.unshift({ secretKey, createdAt: Date.now() }),
    delete(state, secretKey) {
      state.invites = state.invites.filter((invite) => invite.secretKey !== secretKey);
    },
  },
  actions: {
    async claim({ rootGetters: { account, activeNetwork } }, secretKey) {
      const s = new AeSdk({
        nodes: [{ name: activeNetwork.name, instance: new Node(activeNetwork.url) }],
        accounts: [new MemoryAccount(secretKey)],
      });
      await s.transferFunds(1, account.address, { payload: 'referral', verify: false });
    },
    async handleNotEnoughFoundsError({ dispatch }, { error: { message }, isInviteError = false }) {
      if (!isInviteError && !message.includes('is not enough to execute')) return false;
      if (isInviteError && !message.includes('Transaction build error')) return false;
      await dispatch(
        'modals/open',
        {
          name: 'default',
          msg: isInviteError
            ? i18n.t('pages.invite.insufficient-invite-balance')
            : i18n.t('pages.invite.insufficient-balance'),
        },
        { root: true },
      );
      return true;
    },
  },
};
