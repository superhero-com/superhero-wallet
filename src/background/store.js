import Vuex from 'vuex';
import persistState from '../store/plugins/persistState';
import permissions from '../store/modules/permissions';
import accounts from '../store/modules/accounts';

const store = new Vuex.Store({
  plugins: [persistState()],
  modules: { permissions, accounts },
  getters: {
    'names/getDefault': () => (address) => `placeholder name for ${address}`,
  },
});

export default store;
