/* eslint no-param-reassign: ['error', { 'ignorePropertyModificationsFor': ['state'] }] */

import Vue from 'vue';
import hdWallet from './hdWallet';
import ledger from './ledger';

const modules = { hdWallet, ledger };

export default {
  namespaced: true,
  modules,

  state: {
    list: [{
      idx: 0, showed: true, type: 'hd-wallet',
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
    },
    remove(state, idx) {
      if (state.activeIdx === state.list.length) state.activeIdx = 0;
      Vue.delete(state.list, idx);
    },
    toggleShowed(state, idx) {
      if (state.activeIdx === idx) state.activeIdx = 0;
      Vue.set(state.list[idx], 'showed', !state.list[idx].showed);
    },
  },

  actions: {
    sign({ getters: { active, getModule }, dispatch }, data) {
      return dispatch(`${getModule(active).name}/sign`, data);
    },

    signTransaction({ getters: { active, getModule }, dispatch }, txBase64) {
      return dispatch(`${getModule(active).name}/signTransaction`, txBase64);
    },
  },
};
