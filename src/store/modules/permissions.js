import { aettosToAe } from '../../popup/utils';

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
  state: {},
  mutations: {

    setTransactionSignLimit(state, { host, value }) {
      state[host] = {
        ...state[host],
        transactionSignLimit: value,
        transactionSignLimitLeft: value,
        transactionSignFirstAskedOn: new Date(),
      };
    },
    setTransactionSignLimitLeft(state, { host, value }) {
      state[host] = {
        ...state[host],
        transactionSignLimitLeft: value,
      };
    },
    resetTransactionSignLimitLeft(state, host) {
      state[host] = {
        ...state[host],
        transactionSignLimitLeft: state[host].transactionSignLimit,
        transactionSignFirstAskedOn: new Date(),
      };
    },
    addAddressToHost(state, { host, address, name }) {
      if (!state[host]) state[host] = { ...hostConfig([address]), name, host };
      else state[host].addresses.push(address);
    },
    addPermission(state, permission) {
      state[permission.host] = permission;
    },
    removePermission(state, host) {
      delete state[host];
    },
  },

  actions: {
    checkTransactionSignPermission({ state, commit }, {
      host, amount = 0, fee = 0, nameFee = 0,
    }) {
      const { transactionSignLimit, transactionSignFirstAskedOn } = state[host] || {};
      if (!transactionSignLimit) return false;
      if (
        !transactionSignFirstAskedOn
        || new Date() - new Date(transactionSignFirstAskedOn) >= 24 * 60 * 60 * 1000
      ) {
        commit('resetTransactionSignLimitLeft', host);
      }

      const limitLeft = state[host].transactionSignLimitLeft
        - aettosToAe(+amount + +fee + +nameFee);
      if (limitLeft < 0) return false;
      commit('setTransactionSignLimitLeft', { host, value: limitLeft });
      return true;
    },
    checkPermissions({ dispatch, state }, { host, method, params = {} }) {
      if (method === 'transaction.sign') return dispatch('checkTransactionSignPermission', { host, ...params });
      const permissionsMethods = {
        'connection.open': 'address',
        'address.subscribe': 'address',
        messageSign: 'messageSign',
      };
      return state[host]?.[permissionsMethods[method]];
    },
    async requestAddressForHost({ dispatch }, {
      host,
      connectionPopupCb,
    }) {
      if (await dispatch('checkPermissions', { host, method: 'connection.open' })) return true;
      try {
        await connectionPopupCb();
        return true;
      } catch {
        return false;
      }
    },
  },
};
