import { Universal, MemoryAccount, Crypto } from '@aeternity/aepp-sdk/es';
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
    async claim({ rootState: { account, current, sdk } }, secretKey) {
      const publicKey = Crypto.getAddressFromPriv(secretKey);
      // TODO: Remove this after merging https://github.com/aeternity/aepp-sdk-js/pull/1060
      const s = await Universal({
        nodes: [sdk.pool.get(current.network)],
        accounts: [MemoryAccount({ keypair: { publicKey, secretKey } })],
      });
      await s.transferFunds(1, account.publicKey, { payload: 'referral', verify: false });
    },
    async handleNotEnoughFoundsError({ dispatch }, error) {
      if (!error.message.includes('is not enough to execute')) return false;
      await dispatch(
        'modals/open',
        { name: 'default', msg: i18n.t('pages.invite.insufficient-balance') },
        { root: true },
      );
      return true;
    },
  },
};
