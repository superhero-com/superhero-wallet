import Vue from 'vue';
import Vuex from 'vuex';
import getters from './getters';
import mutations from './mutations';
import actions from './actions';
import sdkPlugin from './plugins/sdk';
import persistState from './plugins/persistState';
import modals from './plugins/modals';
import tipUrl from './plugins/tipUrl';
import namesPlugin from './plugins/names';
import pendingTransactionHandler from './plugins/pendingTransactionHandler';
import languagesPlugin from './plugins/languages';
import openErrorModalPlugin from './plugins/openErrorModal';
import pollAccountInfo from './plugins/pollAccountInfo';
import runMigrations from './migrations';
import accountsModule from './modules/accounts';
import invitesModule from './modules/invites';
import permissionsModule from './modules/permissions';
import stateReducer from './utils';
import veeValidate from './plugins/veeValidate';
import { defaultNetwork, NODE_STATUS_OFFLINE } from '../popup/utils/constants';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    isRestored: false,
    mnemonic: null,
    current: {
      network: defaultNetwork.name,
      token: 0,
      currency: 'usd',
    },
    userNetworks: [],
    transactions: {
      loaded: [],
      nextPageUrl: '',
      pending: {},
      tipWithdrawnTransactions: [],
    },
    middleware: null,
    tippingV1: null,
    tippingV2: null,
    nodeStatus: NODE_STATUS_OFFLINE,
    currencies: {},
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
    modals,
    tipUrl,
    namesPlugin,
    pendingTransactionHandler,
    languagesPlugin,
    openErrorModalPlugin,
    veeValidate,
    pollAccountInfo,
  ],
  modules: {
    accounts: accountsModule,
    invites: invitesModule,
    permissions: permissionsModule,
  },
});
