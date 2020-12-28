import Vue from 'vue';
import { aettosToAe } from '../../popup/utils/helper';

const hostConfig = (addresses, isDefault = false) => ({
  addresses,
  address: isDefault,
  messageSign: isDefault,
  transactionSignLimit: isDefault ? 50 : 0,
  transactionSignLimitLeft: isDefault ? 50 : 0,
  transactionSignFirstAskedOn: null,
});

export class App {
  constructor(host) {
    this.host = host;
  }
}

export default {
  namespaced: true,

  state: Object.fromEntries(
    ['superhero.com', 'localhost'].map((domain) => [domain, hostConfig([], true)]),
  ),

  mutations: {
    togglePermission(state, { host, name }) {
      state[host][name] = !state[host][name];
    },
    setTransactionSignLimit(state, { host, value }) {
      state[host].transactionSignLimit = value;
      state[host].transactionSignLimitLeft = value;
      state[host].transactionSignFirstAskedOn = new Date();
    },
    setTransactionSignLimitLeft(state, { host, value }) {
      state[host].transactionSignLimitLeft = value;
    },
    resetTransactionSignLimitLeft(state, host) {
      state[host].transactionSignLimitLeft = state[host].transactionSignLimit;
      state[host].transactionSignFirstAskedOn = new Date();
    },
    addHost(state, host) {
      Vue.set(state, host, hostConfig([]));
    },
    addAddressToHost(state, { host, address }) {
      if (!state[host]) Vue.set(state, host, hostConfig([address]));
      else state[host].addresses.push(address);
    },
    removeAeppPermissions(state, host) {
      Vue.delete(state, host);
    },
  },

  actions: {
    checkTransactionSignPermission({ state, commit }, { host, amount = 0, fee = 0, nameFee = 0 }) {
      const { transactionSignLimit, transactionSignFirstAskedOn } = state[host] || {};
      if (!transactionSignLimit) return false;
      if (new Date() - new Date(transactionSignFirstAskedOn) >= 24 * 60 * 60 * 1000) {
        commit('resetTransactionSignLimitLeft', host);
      }

      const limitLeft =
        state[host]?.transactionSignLimitLeft - aettosToAe(+amount + +fee + +nameFee);
      if (limitLeft < 0) return false;
      commit('setTransactionSignLimitLeft', { host, value: limitLeft });
      return true;
    },
    checkPermissions({ dispatch, state }, { host, method, params = {} }) {
      if (method === 'transaction.sign')
        return dispatch('checkTransactionSignPermission', { host, ...params });
      const permissionsMethods = {
        'connection.open': 'address',
        'address.subscribe': 'address',
        'message.sign': 'messageSign',
      };
      return state[host]?.[permissionsMethods[method]];
    },
    async requestAddressForHost({ state, commit, dispatch }, { host, address, connectionPopupCb }) {
      if (state[host]?.addresses?.includes(address)) return true;

      try {
        if (!(await dispatch('checkPermissions', { host, method: 'connection.open' }))) {
          const cp = await connectionPopupCb();
          if (cp !== undefined && !cp) return false;
        }
      } catch {
        return false;
      }
      commit('addAddressToHost', { host, address });

      return true;
    },
  },
};
