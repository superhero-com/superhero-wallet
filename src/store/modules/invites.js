import { Universal, MemoryAccount, Crypto } from '@aeternity/aepp-sdk';
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
    async claim({ rootState: { current, sdk }, rootGetters: { account } }, secretKey) {
      const publicKey = Crypto.getAddressFromPriv(secretKey);
      // TODO: Remove this after fixing https://github.com/aeternity/aepp-sdk-js/issues/1261
      const { name, instance } = sdk.pool.get(current.network);
      // TODO: Remove this after merging https://github.com/aeternity/aepp-sdk-js/pull/1060
      const s = await Universal({
        nodes: [{ name, instance }],
        accounts: [MemoryAccount({ keypair: { publicKey, secretKey } })],
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
            ? i18n.t('pages.invite.insufficient-ivnite-balance')
            : i18n.t('pages.invite.insufficient-balance'),
        },
        { root: true },
      );
      return true;
    },
  },
};
