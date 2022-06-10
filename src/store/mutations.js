/* eslint no-param-reassign: ["error", { "ignorePropertyModificationsFor": ["state"] }] */
import Vue from 'vue';
import { uniqBy } from 'lodash-es';
import { defaultNetwork } from '../popup/utils/constants';

export default {
  switchNetwork(state, payload) {
    state.current.network = payload;
  },
  addTransactions(state, payload) {
    state.transactions.loaded = uniqBy([...state.transactions.loaded, ...payload], 'hash');
  },
  initTransactions(state) {
    state.transactions.loaded = [];
    state.transactions.nextPageUrl = '';
  },
  setTransactionsNextPage(state, pageUrl) {
    state.transactions.nextPageUrl = pageUrl;
  },
  addPendingTransaction(state, payload) {
    state.transactions.pending.push({ ...payload, microTime: Date.now() });
  },
  removePendingTransactionByHash(state, hash) {
    state.transactions.pending = state.transactions.pending.filter((t) => t.hash !== hash);
  },
  setUserNetwork(state, { index, ...network }) {
    if (index !== undefined) Vue.set(state.userNetworks, index, network);
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
  setNodeStatus(state, payload) {
    if (state.nodeStatus === 'offline') {
      if (payload !== 'online') return;
      state.nodeStatus = '';
    } else {
      state.nodeStatus = payload;
    }
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
  setSaveErrorLog(state) {
    state.saveErrorLog = !state.saveErrorLog;
  },
  setLoginTargetLocation(state, location) {
    state.loginTargetLocation = location;
  },
  setSdkAccounts({ sdk }, list) {
    sdk.accounts = list.reduce((p, { address }) => ({ ...p, [address]: {} }), {});
  },
  selectSdkAccount({ sdk }, address) {
    sdk.selectAccount(address);
  },
  toggleMinifiedCard(state) {
    state.cardMinified = !state.cardMinified;
  },
};
