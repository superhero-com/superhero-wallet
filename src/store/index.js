import Vue from 'vue';
import Vuex from 'vuex';
import getters from './getters';
import mutations from './mutations';
import actions from './actions';
import sdkPlugin from './plugins/sdk';
import sdk13Plugin from './plugins/sdk13';
import persistState from './plugins/persistState';
import tipUrl from './plugins/tipUrl';
import namesPlugin from './plugins/names';
import pendingTransactionHandler from './plugins/pendingTransactionHandler';
import languagesPlugin from './plugins/languages';
import pollAccountInfo from './plugins/pollAccountInfo';
import runMigrations from './migrations';
import accountsModule from './modules/accounts';
import invitesModule from './modules/invites';
import permissionsModule from './modules/permissions';
import fungibleTokensPlugin from './plugins/fungibleTokens';
import stateReducer from './utils';
import veeValidate from './plugins/veeValidate';
import { defaultNetwork, NODE_STATUS_CONNECTING } from '../popup/utils/constants';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    isRestored: false,
    mnemonic: null,
    current: {
      network: defaultNetwork.name,
      token: 0,
    },
    userNetworks: [],
    transactions: {
      loaded: [],
      nextPageUrl: '',
      pending: {},
      tipWithdrawnTransactions: [],
    },
    tippingV1: null,
    tippingV2: null,
    nodeStatus: NODE_STATUS_CONNECTING,
    notificationSettings: [],
    chainNames: null,
    tip: null,
    migrations: {},
    backedUpSeed: null,
    saveErrorLog: true,
    loginTargetLocation: { name: 'account' },
    cardMinified: false,
    qrScannerOpen: false,
    hiddenCards: [],
  },
  getters,
  mutations,
  actions,
  plugins: [
    persistState(
      runMigrations,
      stateReducer,
    ),
    sdkPlugin,
    sdk13Plugin,
    modals,
    tipUrl,
    namesPlugin,
    fungibleTokensPlugin,
    pendingTransactionHandler,
    languagesPlugin,
    veeValidate,
    pollAccountInfo,
  ],
  modules: {
    accounts: accountsModule,
    invites: invitesModule,
    permissions: permissionsModule,
  },
});
