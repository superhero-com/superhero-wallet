import Vuex from 'vuex';
import getters from './getters';
import mutations from './mutations';
import persistState from './plugins/persistState';
import pollAccountInfo from './plugins/pollAccountInfo';
import runMigrations from './migrations';
import accountsModule from './modules/accounts';
import permissionsModule from './modules/permissions';
import fungibleTokensPlugin from './plugins/fungibleTokens';
import stateReducer from './utils';
import veeValidate from './plugins/veeValidate';

export default new Vuex.Store({
  state: {
    isRestored: false,
    notificationSettings: [],
    chainNames: null,
    migrations: {},
  },
  getters,
  mutations,
  plugins: [
    persistState(
      runMigrations,
      stateReducer,
    ),
    fungibleTokensPlugin,
    veeValidate,
    pollAccountInfo,
  ],
  modules: {
    accounts: accountsModule,
    permissions: permissionsModule,
  },
});
