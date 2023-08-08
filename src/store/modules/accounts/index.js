/* eslint no-param-reassign: ['error', { 'ignorePropertyModificationsFor': ['state'] }] */

import {
  ACCOUNT_HD_WALLET,
  PROTOCOL_AETERNITY,
} from '@/constants';
import hdWallet from './hdWallet';

// TODO: modules file is an object, because previously it contained more than one module,
// should be improved in the future
const modules = { hdWallet };

export default {
  namespaced: true,
  modules,

  state: {
    list: [{
      idx: 0, showed: true, type: ACCOUNT_HD_WALLET, protocol: PROTOCOL_AETERNITY,
    }],
    activeIdx: 0,
  },

  getters: {
    active: ({ list, activeIdx }) => list[activeIdx],
    getByType: ({ list }) => (type) => list.filter((acc) => acc.type === type),
    getModule: () => ({ type }) => {
      const [name, module] = Object.entries(modules)
        .find(([, { account }]) => account.type === type)
        || (() => { throw new Error(`Unknown account type: ${type}`); })();
      return { ...module, name };
    },
  },

  mutations: {
    setActiveIdx(state, activeIdx) {
      state.activeIdx = activeIdx;
    },
    add(state, account) {
      state.list.push({
        showed: state.list.reduce((a, b) => (b.showed ? a + 1 : a), 0) < 8,
        ...account,
      });
      if (!account.isRestored) {
        state.activeIdx = account.idx;
      }
    },
    remove(state, idx) {
      if (state.activeIdx === state.list.length) state.activeIdx = 0;
      delete state.list[idx];
    },
    toggleShowed(state, idx) {
      if (state.activeIdx === idx) state.activeIdx = 0;
      state.list[idx].showed = !state.list[idx].showed;
    },
  },

  actions: {
    sign({ getters: { active, getModule }, dispatch }, data) {
      return dispatch(`${getModule(active).name}/sign`, data);
    },

    signTransaction({ getters: { active, getModule }, dispatch }, { txBase64, options }) {
      if (options && options.fromAccount) {
        return dispatch(`${getModule(active).name}/signTransactionFromAccount`, { txBase64, options });
      }
      return dispatch(`${getModule(active).name}/signTransaction`, { txBase64, options });
    },
  },
};
