/* eslint no-param-reassign: ["error", { "ignorePropertyModificationsFor": ["state"] }] */
import Vue from 'vue';
import { uniqBy } from 'lodash-es';
import {
  NETWORK_DEFAULT,
  TX_DIRECTION,
} from '../popup/utils';

export default {
  switchNetwork(state, payload) {
    state.current.network = payload;
  },
  addTransactions(state, payload) {
    Vue.set(state.transactions, 'loaded', uniqBy([...state.transactions.loaded, ...payload], 'hash'));
  },
  setTransactionByHash(state, transaction) {
    const index = state.transactions.loaded.findIndex((t) => t.hash === transaction.hash);
    if (index !== -1) Vue.set(state.transactions.loaded, index, transaction);
  },
  setTipWithdrawnTransactions(state, payload) {
    Vue.set(state.transactions, 'tipWithdrawnTransactions', payload);
  },
  initTransactions(state) {
    Vue.set(state.transactions, 'loaded', []);
    Vue.set(state.transactions, 'nextPageUrl', '');
    Vue.set(state.transactions, 'tipWithdrawnTransactions', []);
    Vue.set(state.transactions, 'pending', []);
  },
  setTransactionsNextPage(state, pageUrl) {
    Vue.set(state.transactions, 'nextPageUrl', pageUrl);
  },
  addPendingTransaction(state, { transaction, network }) {
    Vue.set(state.transactions.pending, network,
      [...(state.transactions.pending[network] || []), transaction]);
  },
  removePendingTransactionByHash(state, { network, hash }) {
    Vue.set(state.transactions.pending, network, state.transactions.pending[network]
      .filter((t) => t.hash !== hash));
  },
  setPendingTransactionSentByHash(state, { network, hash }) {
    const index = state.transactions.pending[network].findIndex((t) => t.hash === hash);
    Vue.set(state.transactions.pending[network][index], TX_DIRECTION.sent, true);
  },
  setUserNetwork(state, { index, ...network }) {
    if (index !== undefined) Vue.set(state.userNetworks, index, network);
    else state.userNetworks.push({ ...NETWORK_DEFAULT, ...network });
  },
  deleteUserNetwork(state, index) {
    state.userNetworks = state.userNetworks.filter((el, idx) => idx !== index);
  },
  setTipping(state, [tippingV1, tippingV2]) {
    state.tippingV1 = tippingV1 || null;
    state.tippingV2 = tippingV2 || null;
  },
  setNodeStatus(state, payload) {
    state.nodeStatus = payload;
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
  setMnemonic(state, payload) {
    state.mnemonic = payload;
  },
  setBackedUpSeed(state) {
    state.backedUpSeed = true;
  },
  setSaveErrorLog(state, saveErrorLog) {
    state.saveErrorLog = saveErrorLog;
  },
  setLoginTargetLocation(state, location) {
    state.loginTargetLocation = location;
  },
  setQrScanner(state, payload) {
    state.qrScannerOpen = payload;
  },
  hideCard(state, name) {
    state.hiddenCards.push(name);
  },
};
