import Vuex from 'vuex';
import persistState from '../store/plugins/persistState';
import permissions from '../store/modules/permissions';
import accounts from '../store/modules/accounts';
import getters from '../store/getters';

const store = new Vuex.Store({
  plugins: [persistState()],
  modules: { permissions, accounts },
  getters: {
    'names/getDefault': () => (address) => `placeholder name for ${address}`,
    wallet: getters.wallet,
    networks: getters.networks,
    activeNetwork: getters.activeNetwork,
  },
});

export default store;
