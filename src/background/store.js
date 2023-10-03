import Vuex from 'vuex';
import persistState from '../store/plugins/persistState';
import accounts from '../store/modules/accounts';

const store = new Vuex.Store({
  plugins: [persistState()],
  modules: { accounts },
});

export default store;
