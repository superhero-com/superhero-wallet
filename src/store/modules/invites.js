import { Crypto } from '@aeternity/aepp-sdk';
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
    async claim({ rootState: { sdk }, rootGetters: { account } }, secretKey) {
      const publicKey = Crypto.getAddressFromPriv(secretKey);
      await sdk.transferFunds(
        1,
        account.address,
        { payload: 'referral', onAccount: { publicKey, secretKey } },
      );
    },
    async handleNotEnoughFoundsError({ dispatch }, { error: { message }, isInviteError = false }) {
      if (!isInviteError && !message.includes('is not enough to execute')) return false;
      if (isInviteError && !message.includes('Transaction build error')) return false;
      await dispatch(
        'modals/open',
        {
          name: 'default',
          msg: isInviteError
            ? i18n.t('pages.invite.insufficient-ivnite-balance')
            : i18n.t('pages.invite.insufficient-balance'),
        },
        { root: true },
      );
      return true;
    },
  },
};
