import Vuex from 'vuex';
import getters from './getters';
import mutations from './mutations';
import persistState from './plugins/persistState';
import tipUrl from './plugins/tipUrl';
import namesPlugin from './plugins/names';
import languagesPlugin from './plugins/languages';
import runMigrations from './migrations';
import accountsModule from './modules/accounts';
import invitesModule from './modules/invites';
import permissionsModule from './modules/permissions';
import stateReducer from './utils';
import veeValidate from './plugins/veeValidate';

export default new Vuex.Store({
  state: {
    isRestored: false,
    mnemonic: null,
    notificationSettings: [],
    chainNames: null,
    migrations: {},
    backedUpSeed: null,
    saveErrorLog: true,
    loginTargetLocation: { name: 'account' },
    qrScannerOpen: false,
    hiddenCards: [],
  },
  getters,
  mutations,
  plugins: [
    persistState(
      runMigrations,
      stateReducer,
    ),
    tipUrl,
    namesPlugin,
    languagesPlugin,
    veeValidate,
  ],
  modules: {
    accounts: accountsModule,
    invites: invitesModule,
    permissions: permissionsModule,
  },
});
