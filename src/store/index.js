import Vue from 'vue';
import Vuex from 'vuex';

import { getters } from './getters';
import mutations from './mutations';
import actions from './actions';
import { POPUP_PROPS } from '../popup/utils/popup-messages';
import { networks } from '../popup/utils/constants';
import names from '../popup/utils/names'
import observables from '../popup/utils/observables';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    subaccounts: [],
    account: {},
    activeAccount: 0,
    names: [],
    pendingNames: [],
    wallet: [],
    balance: 0,
    current: {
      network: 'Testnet',
      language: '',
      token: 0
    },
    network: networks,
    userNetworks: [],
    popup: Object.assign({}, POPUP_PROPS),
    isLoggedIn: false,
    transactions: {
      latest: [],
      all: [],
      new: []
    },
    sdk: null,
    tokens: [
      {
        name: "AE",
        symbol: "AE",
        precision: 7,
        balance: 0,
        contract: ''
      }
    ],
    aeppPopup: false,
    ledgerApi: null,
    background:null,
    tokenRegistry: null,
    tokenRegistryLima:null,
    txAdvancedMode:false,
    tipping:null,
    tippingReceiver: {}
  },
  getters,
  mutations,
  actions,
  plugins: [ names]
});
