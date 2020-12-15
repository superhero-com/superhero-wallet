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
import runMigrations from './migrations';
import invitesModule from './modules/invites';
import permissionsModule from './modules/permissions';
import fungibleTokensModule from './modules/fungibleTokens';
import { defaultNetwork } from '../popup/utils/constants';

Vue.use(Vuex);
Vue.use(VueRx);

export default new Vuex.Store({
  state: {
    isRestored: false,
    account: {},
    mnemonic: null,
    activeAccount: 0,
    current: {
      network: defaultNetwork.name,
      token: 0,
      currency: 'usd',
    },
    userNetworks: [],
    isLoggedIn: false,
    transactions: {
      latest: [],
      pending: [],
    },
    pageTitle: '',
    sdk: null,
    middleware: null,
    tippingV1: null,
    tippingV2: null,
    mainLoading: true,
    nodeStatus: 'connecting',
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
  },
  getters,
  mutations,
  actions,
  plugins: [
    persistState(
      runMigrations,
      ({
        migrations,
        current,
        transactions,
        currencies,
        userNetworks,
        names,
        languages,
        nextCurrenciesFetch,
        tip,
        backedUpSeed,
        account,
        mnemonic,
        saveErrorLog,
        tourStartBar,
        invites,
        notificationSettings,
        permissions,
        fungibleTokens,
      }) => ({
        migrations,
        current,
        transactions,
        currencies,
        userNetworks,
        names,
        languages,
        nextCurrenciesFetch,
        tip,
        backedUpSeed,
        account,
        mnemonic,
        saveErrorLog,
        tourStartBar,
        invites,
        notificationSettings,
        permissions,
        fungibleTokens,
      }),
    ),
    observables,
    modals,
    tipUrl,
    accounts,
    namesPlugin,
    pendingTransactionHandler,
    languagesPlugin,
  ],
  modules: {
    invites: invitesModule,
    permissions: permissionsModule,
    fungibleTokens: fungibleTokensModule,
  },
});
