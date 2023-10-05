import Vuex from 'vuex';
import mutations from './mutations';
import persistState from './plugins/persistState';
import runMigrations from './migrations';
import accountsModule from './modules/accounts';
import stateReducer from './utils';
import veeValidate from './plugins/veeValidate';

export default new Vuex.Store({
  state: {
    isRestored: false,
    notificationSettings: [],
    chainNames: null,
    migrations: {},
  },
  mutations,
  plugins: [
    persistState(
      runMigrations,
      stateReducer,
    ),
    veeValidate,
  ],
  modules: {
    accounts: accountsModule,
  },
});
