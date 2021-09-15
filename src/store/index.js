import Vue from 'vue';
import Vuex from 'vuex';
import VueRx from 'vue-rx';
import getters from './getters';
import mutations from './mutations';
import actions from './actions';
import observables from './plugins/observables';
import persistState from './plugins/persistState';
import modals from './plugins/modals';
import tipUrl from './plugins/tipUrl';
import accounts from './plugins/account';
import namesPlugin from './plugins/names';
import pendingTransactionHandler from './plugins/pendingTransactionHandler';
import languagesPlugin from './plugins/languages';
import openErrorModalPlugin from './plugins/openErrorModal';
import runMigrations from './migrations';
import invitesModule from './modules/invites';
import permissionsModule from './modules/permissions';
import transactionCacheModule from './modules/transactionCache';
import fungibleTokensPlugin from './plugins/fungibleTokens';
import { defaultNetwork } from '../popup/utils/constants';
import stateReducer from './utils';
import chainListener from './plugins/chainListener';

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
      latest: [],
      pending: [],
    },
    pageTitle: '',
    sdk: null,
    middleware: null,
    tippingV1: null,
    tippingV2: null,
    nodeStatus: '',
    currencies: {},
    nextCurrenciesFetch: null,
    notifications: [],
    notificationSettings: [],
    chainNames: null,
    tip: null,
    txQueue: [],
    connectedAepps: {},
    migrations: {},
    backedUpSeed: null,
    tourRunning: false,
    tourStartBar: true,
    saveErrorLog: true,
    loginTargetLocation: { name: 'account' },
    accountCount: 1,
    accountSelectedIdx: 0,
    accs: [{
      idx: 0, color: '#1161FE', shift: 0, showed: true,
    }],
    cardMinified: false,
  },
  getters,
  mutations,
  actions,
  plugins: [
    persistState(
      runMigrations,
      stateReducer,
    ),
    observables,
    modals,
    tipUrl,
    accounts,
    namesPlugin,
    fungibleTokensPlugin,
    pendingTransactionHandler,
    languagesPlugin,
    openErrorModalPlugin,
    chainListener,
  ],
  modules: {
    invites: invitesModule,
    permissions: permissionsModule,
    transactionCache: transactionCacheModule,
  },
});
