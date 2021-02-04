import Vue from 'vue';
import { defaultNetwork } from '../popup/utils/constants';

export default {
  updateAccount(state, payload) {
    state.account = payload;
  },
  switchNetwork(state, payload) {
    state.current.network = payload;
  },
  switchLoggedIn(state, payload) {
    state.isLoggedIn = payload;
  },
  updateLatestTransactions(state, payload) {
    state.transactions.latest = payload;
  },
  addPendingTransaction(state, payload) {
    state.transactions.pending.push({ ...payload, microTime: Date.now() });
  },
  removePendingTransactionByHash(state, hash) {
    state.transactions.pending = state.transactions.pending.filter((t) => t.hash !== hash);
  },
  setActiveAccount(state, payload) {
    state.account.publicKey = payload.publicKey;
    state.activeAccount = payload.index;
  },
  setUserNetwork(state, { index, ...network }) {
    if (index !== undefined) state.userNetworks[index] = network;
    else state.userNetworks.push({ ...defaultNetwork, ...network });
  },
  deleteUserNetwork(state, index) {
    state.userNetworks = state.userNetworks.filter((el, idx) => idx !== index);
  },
  initSdk(state, payload) {
    state.sdk = payload;
  },
  setMiddleware(state, payload) {
    state.middleware = payload;
  },
  setTipping(state, [tippingV1, tippingV2]) {
    state.tippingV1 = tippingV1 || null;
    state.tippingV2 = tippingV2 || null;
  },
  setMainLoading(state, payload) {
    state.mainLoading = payload;
  },
  setNodeStatus(state, payload) {
    state.nodeStatus = payload;
  },
  setCurrentCurrency(state, currency) {
    state.current.currency = currency;
  },
  setPageTitle(state, title) {
    state.pageTitle = title;
  },
  setCurrencies(state, payload) {
    state.currencies = payload;
  },
  setNextCurrencyFetch(state, payload) {
    state.nextCurrenciesFetch = payload;
  },
  addNotification(state, payload) {
    state.notifications = [
      ...state.notifications,
      {
        ...payload,
        type: 'wallet',
        status: 'CREATED',
        createdAt: new Date().toISOString(),
      },
    ];
  },
  setNotificationsStatus(state, { createdAt, status }) {
    const index = state.notifications.findIndex((n) => n.createdAt === createdAt);
    Vue.set(state.notifications[index], 'status', status);
  },
  setNotificationSettings(state, payload) {
    state.notificationSettings = payload;
  },
  toggleNotificationSetting(state, type) {
    const index = state.notificationSettings.findIndex((n) => n.type === type);
    Vue.set(
      state.notificationSettings[index],
      'checked',
      !state.notificationSettings[index].checked,
    );
  },
  setChainNames(state, payload) {
    state.chainNames = payload;
  },
  setTipDetails(state, payload) {
    state.tip = payload;
  },
  setMnemonic(state, payload) {
    state.mnemonic = payload;
  },
  setBackedUpSeed(state) {
    state.backedUpSeed = true;
  },
  setTourRunning(state, payload) {
    state.tourRunning = payload;
  },
  setTourStatusBar(state, payload) {
    state.tourStartBar = payload;
  },
  setSaveErrorLog(state) {
    state.saveErrorLog = !state.saveErrorLog;
  },
  setLoginTargetLocation(state, location) {
    state.loginTargetLocation = location;
  },
};
