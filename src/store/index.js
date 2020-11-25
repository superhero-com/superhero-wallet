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
import tokens from './plugins/tokens';
import names from './plugins/names';
import pendingTransactionHandler from './plugins/pendingTransactionHandler';
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
    balance: 0,
    current: {
      network: defaultNetwork.name,
      language: 'en',
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
  mutations: {
    setState(state, newState) {
      Object.entries({ ...state, ...newState }).forEach(([name, value]) =>
        Vue.set(state, name, value),
      );
    },
    ...mutations,
  },
  actions,
  plugins: [
    persistState(
      runMigrations,
      ({
        migrations,
        current,
        transactions,
        balance,
        currencies,
        userNetworks,
        names: { owned, defaults } = {},
        nextCurrenciesFetch,
        tip,
        connectedAepps,
        backedUpSeed,
        account,
        mnemonic,
        saveErrorLog,
        tourStartBar,
        tokens: { all },
        invites,
        notificationSettings,
        permissions,
        fungibleTokens,
      }) => ({
        migrations,
        current,
        transactions,
        balance,
        currencies,
        userNetworks,
        names: { owned, defaults },
        nextCurrenciesFetch,
        tip,
        connectedAepps,
        backedUpSeed,
        account,
        mnemonic,
        saveErrorLog,
        tourStartBar,
        tokens: { all },
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
    tokens,
    names,
    pendingTransactionHandler,
  ],
  modules: {
    invites: invitesModule,
    permissions: permissionsModule,
    fungibleTokens: fungibleTokensModule,
  },
});
