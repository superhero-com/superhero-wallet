import Vue from 'vue';
import Vuex from 'vuex';
import { mergeWith } from 'lodash-es';
import getters from './getters';
import mutations from './mutations';
import actions from './actions';
import persistState from './plugins/persistState';
import modals from './plugins/modals';
import runMigrations from './migrations';
import { networks, DEFAULT_NETWORK } from '../popup/utils/constants';

Vue.use(Vuex);

const initialState = {
  isRestored: false,
  subaccounts: [],
  account: {},
  mnemonic: null,
  activeAccount: 0,
  names: [],
  wallet: [],
  balance: 0,
  current: {
    network: DEFAULT_NETWORK,
    language: 'en',
    token: 0,
    currency: 'usd',
    currencyRate: 0,
  },
  network: networks,
  userNetworks: [],
  isLoggedIn: false,
  transactions: {
    latest: [],
    pending: [],
  },
  sdk: null,
  middleware: null,
  aeppPopup: false,
  ledgerApi: null,
  txAdvancedMode: false,
  tipping: null,
  tippingReceiver: {},
  tippingAddress: null,
  mainLoading: true,
  nodeStatus: 'connecting',
  currencies: {},
  nextCurrenciesFetch: null,
  minTipAmount: 0.01,
  notifications: [],
  notificationsCounter: null,
  tip: null,
  txQueue: [],
  connectedAepps: {},
  migrations: {},
  backedUpSeed: null,
  tourRunning: false,
  tourStartBar: true,
  saveErrorLog: true,
};

export default new Vuex.Store({
  state: { ...initialState },
  getters,
  mutations: {
    syncState(state, remoteState) {
      const customizer = (objValue, srcValue) => {
        if (!Array.isArray(srcValue)) return undefined;
        if (!Array.isArray(objValue)) return srcValue;
        return srcValue.map((el, idx) =>
          el && typeof el === 'object' ? mergeWith({}, objValue[idx], el, customizer) : el,
        );
      };
      Object.entries(mergeWith({}, state, remoteState, customizer)).forEach(([name, value]) =>
        Vue.set(state, name, value),
      );
    },
    markMigrationAsApplied(state, migrationId) {
      Vue.set(state.migrations, migrationId, true);
    },
    resetState(state, remoteState) {
      Object.entries(mergeWith({}, initialState, remoteState)).forEach(([name, value]) =>
        Vue.set(state, name, value),
      );
    },
    ...mutations,
  },
  actions,
  plugins: [
    persistState(
      (state, store) => runMigrations(state, store),
      ({
        migrations,
        current,
        transactions,
        balance,
        subaccounts,
        currencies,
        userNetworks,
        names,
        nextCurrenciesFetch,
        tip,
        notificationsCounter,
        connectedAepps,
        backedUpSeed,
        account,
        mnemonic,
        minTipAmount,
        saveErrorLog,
      }) => ({
        migrations,
        current,
        transactions,
        balance,
        subaccounts,
        currencies,
        userNetworks,
        names,
        nextCurrenciesFetch,
        tip,
        notificationsCounter,
        connectedAepps,
        backedUpSeed,
        account,
        mnemonic,
        minTipAmount,
        saveErrorLog,
      }),
    ),
    modals,
  ],
});
