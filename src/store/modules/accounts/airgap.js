import { MODAL_DEFAULT, ACCOUNT_AIR_GAP_WALLET, MODAL_AIR_GAP_SIGN_TRANSACTION } from '../../../popup/utils';

export default {
  namespaced: true,

  account: {
    type: ACCOUNT_AIR_GAP_WALLET,
  },

  getters: {
    nextIdx: (state, getters, rootState, rootGetters) => Math.max(
      ...rootGetters['accounts/getByType'](ACCOUNT_AIR_GAP_WALLET).map(({ idx }) => idx),
      -1,
    ) + 1,
  },

  actions: {
    async import({ getters: { nextIdx }, commit, rootState }, account) {
      commit('accounts/add', {
        ...account,
        type: ACCOUNT_AIR_GAP_WALLET,
        idx: nextIdx,
      }, { root: true });
      commit('accounts/setActiveIdx', rootState.accounts.list.length - 1, { root: true });
    },

    async ensureCurrentAccountAvailable({ rootGetters: { account }, dispatch }) {
      const address = await dispatch('request', { name: 'getAddress', args: [account.idx] });
      if (account.address !== address) {
        if (!process.env.IS_EXTENSION) {
          dispatch('modals/open', { name: MODAL_DEFAULT, icon: 'alert', title: 'account not found' }, { root: true });
        }
        throw new Error('Account not found');
      }
    },

    sign: () => Promise.reject(new Error('AirGap Sign Not implemented yet')),
    signTransaction: async ({ dispatch }, { txBase64 }) => dispatch('modals/open', {
      name: MODAL_AIR_GAP_SIGN_TRANSACTION,
      txRaw: txBase64,
    }, { root: true }),

    async signTransactionFromAccount({ dispatch }, { txBase64 }) {
      return dispatch('signTransaction', { txBase64 });
    },
  },
};
