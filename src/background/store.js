import Vue from 'vue';
import Vuex from 'vuex';
import persistState from '../store/plugins/persistState';
import sdk from '../store/plugins/sdk';
import permissions from '../store/modules/permissions';
import accounts from '../store/modules/accounts';
import getters from '../store/getters';

Vue.use(Vuex);

const store = new Vuex.Store({
  plugins: [sdk, persistState()],
  modules: { permissions, accounts },
  getters: {
    'names/getDefault': () => (address) => `placeholder name for ${address}`,
    wallet: getters.wallet,
    accounts: getters.accounts,
    account: getters.account,
    isLoggedIn: getters.isLoggedIn,
    networks: getters.networks,
    activeNetwork: getters.activeNetwork,
  },
});

export default store;
