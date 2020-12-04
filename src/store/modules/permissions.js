import { aettosToAe } from '../../popup/utils/helper';

export default {
  namespaced: true,

  state: {
    address: true,
    messageSign: true,
    transactionSignLimit: 0,
    transactionSignLimitLeft: 0,
    transactionSignFirstAskedOn: null,
  },

  mutations: {
    togglePermission(state, name) {
      state[name] = !state[name];
    },
    setTransactionSignLimit(state, value) {
      state.transactionSignLimit = value;
      state.transactionSignLimitLeft = value;
      state.transactionSignFirstAskedOn = new Date();
    },
    setTransactionSignLimitLeft(state, value) {
      state.transactionSignLimitLeft = value;
    },
    resetTransactionSignLimitLeft(state) {
      state.transactionSignLimitLeft = state.transactionSignLimit;
      state.transactionSignFirstAskedOn = new Date();
    },
  },

  actions: {
    checkTransactionSignPermission({ state, commit }, { amount = 0, fee = 0, nameFee = 0 }) {
      const { transactionSignLimit, transactionSignFirstAskedOn } = state;
      if (!transactionSignLimit) return true;
      if (new Date() - new Date(transactionSignFirstAskedOn) >= 24 * 60 * 60 * 1000) {
        commit('resetTransactionSignLimitLeft');
      }

      const limitLeft = state.transactionSignLimitLeft - aettosToAe(amount + fee + nameFee);
      if (limitLeft < 0) return true;
      commit('setTransactionSignLimitLeft', limitLeft);
      return false;
    },
    checkPermissions({ dispatch, state }, { method, params = {} }) {
      if (method === 'transaction.sign') return dispatch('checkTransactionSignPermission', params);
      const permissionsMethods = {
        'connection.open': 'address',
        'address.subscribe': 'address',
        'message.sign': 'messageSign',
      };
      return state[permissionsMethods[method]];
    },
  },
};
