import * as types from './mutation-types';

export default {
  [types.UPDATE_ACCOUNT](state, payload) {
    state.account = payload;
  },
  [types.UPDATE_BALANCE](state, payload) {
    state.balance = payload;
  },
  [types.SWITCH_NETWORK](state, payload) {
    state.current.network = payload;
  },
  [types.SWITCH_LOGGED_IN](state, payload) {
    state.isLoggedIn = payload;
  },
  [types.UPDATE_LATEST_TRANSACTIONS](state, payload) {
    state.transactions.latest = payload;
  },
  [types.SET_PENDING_TXS](state, payload) {
    state.transactions.pending = payload;
  },
  [types.RESET_TRANSACTIONS](state) {
    state.transactions.all = [];
  },
  [types.SET_SUBACCOUNT](state, payload) {
    state.subaccounts.push(payload);
  },
  [types.SET_SUBACCOUNTS](state, payload) {
    state.subaccounts = payload;
  },
  [types.SET_WALLET](state, payload) {
    state.wallet = payload;
  },
  [types.SET_ACTIVE_ACCOUNT](state, payload) {
    state.account.publicKey = payload.publicKey;
    state.activeAccount = payload.index;
  },
  [types.UNSET_SUBACCOUNTS](state) {
    state.subaccounts = [];
  },
  [types.UPDATE_SUBACCOUNTS_BALANCE](state, payload) {
    state.subaccounts[payload.account].balance = payload.balance;
  },
  [types.SET_ACCOUNT_NAME](state, payload) {
    state.subaccounts[state.activeAccount].name = payload;
  },
  [types.SET_ACCOUNT_AENS](state, { account, aename, pending }) {
    state.subaccounts[account].aename = aename;
    state.subaccounts[account].pending = pending;
  },
  [types.SET_PENDING_NAMES](state, { names }) {
    state.pendingNames = names;
  },
  [types.SET_NAMES](state, { names }) {
    state.names = names;
  },
  [types.SET_USERNETWORK](state, payload) {
    state.userNetworks = { ...state.userNetworks, ...payload };
  },
  [types.SET_USERNETWORKS](state, payload) {
    state.userNetworks = payload;
  },
  [types.SET_NETWORKS](state, payload) {
    state.network = payload;
  },
  [types.ADD_NETWORK](state, payload) {
    state.network = { ...state.network, ...{ [payload.name]: { ...payload } } };
  },
  [types.INIT_SDK](state, payload) {
    state.sdk = payload;
  },
  [types.SET_MIDDLEWARE](state, payload) {
    state.middleware = payload;
  },
  [types.SET_AEPP_POPUP](state, payload) {
    state.aeppPopup = payload;
  },
  [types.SET_LEDGER_API](state, { ledger }) {
    state.ledgerApi = ledger;
  },
  [types.SET_ENCRYPTED_WALLET](state, payload) {
    state.encryptedWallet = payload;
  },
  [types.SET_TX_ADVANCED_MODE](state, payload) {
    state.txAdvancedMode = payload;
  },
  [types.SET_TIPPING](state, payload) {
    state.tipping = payload;
  },
  [types.SET_TIPPING_RECEIVER](state, payload) {
    state.tippingReceiver = payload;
  },
  [types.SET_MAIN_LOADING](state, payload) {
    state.mainLoading = payload;
  },
  [types.SET_NODE_STATUS](state, payload) {
    state.nodeStatus = payload;
  },
  [types.SET_CURRENCY](state, { currency, currencyRate }) {
    state.current.currency = currency;
    state.current.currencyRate = currencyRate;
  },
  [types.SET_CURRENCIES](state, payload) {
    state.currencies = payload;
  },
  [types.SET_NEXT_CURRENCY_FETCH](state, payload) {
    state.nextCurrenciesFetch = payload;
  },
  [types.ADD_NOTIFICATION](state, payload) {
    state.notifications = [...state.notifications, payload];
  },
  [types.SET_NOTIFICATIONS_COUNTER](state, payload) {
    state.notificationsCounter = payload;
  },
  [types.SET_TIP_DETAILS](state, payload) {
    state.tip = payload;
  },
  [types.SET_TX_QUEUE](state, payload) {
    state.txQueue = [...state.txQueue, payload];
  },
  [types.ADD_CONNECTED_AEPP](state, { host, account }) {
    state.connectedAepps = { ...state.connectedAepps, [host]: [account] };
  },
  [types.UPDATE_CONNECTED_AEPP](state, { host, account }) {
    state.connectedAepps = {
      ...state.connectedAepps,
      [host]: [...state.connectedAepps[host].accounts, account],
    };
  },
  [types.SET_MNEMONIC](state, payload) {
    state.mnemonic = payload;
  },
  [types.SET_BACKED_UP_SEED](state, payload) {
    state.backedUpSeed = payload;
  },
  [types.SET_TOUR_RUNNING](state, payload) {
    state.tourRunning = payload;
  },
  [types.SET_TOUR_STATUS_BAR](state, payload) {
    state.tourStartBar = payload;
  },
  [types.SET_TIPPING_ADDRESS](state, payload) {
    state.tippingAddress = payload;
  },
  setMinTipAmount(state, payload) {
    state.minTipAmount = payload;
  },
  setSaveErrorLog(state) {
    state.saveErrorLog = !state.saveErrorLog;
  },
};
