import Vue from 'vue';
import Vuex from 'vuex';
import VueRx from 'vue-rx';
import getters from './getters';
import mutations from './mutations';
import actions from './actions';
import sdkPlugin from './plugins/sdk';
import observables from './plugins/observables';
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
import fungibleTokensPlugin from './plugins/fungibleTokens';
import { defaultNetwork } from '../popup/utils/constants';
import stateReducer from './utils';
import veeValidate from './plugins/veeValidate';

Vue.use(Vuex);
Vue.use(VueRx);

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
    pageTitle: '',
    sdk: null,
    middleware: null,
    tippingV1: null,
    tippingV2: null,
    nodeStatus: '',
    currencies: {},
    notifications: [],
    notificationSettings: [],
    chainNames: null,
    tip: null,
    migrations: {},
    backedUpSeed: null,
    saveErrorLog: true,
    loginTargetLocation: { name: 'account' },
    cardMinified: false,
    qrScannerOpen: false,
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
    observables,
    modals,
    tipUrl,
    namesPlugin,
    fungibleTokensPlugin,
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
