/* eslint no-param-reassign: ["error", { "ignorePropertyModificationsFor": ["state"] }] */
import { uniqBy } from 'lodash-es';
import {
  TX_DIRECTION,
} from '../popup/utils';

export default {
  switchNetwork(state, payload) {
    state.current.network = payload;
  },
  addTransactions(state, payload) {
    state.transactions.loaded = uniqBy([...state.transactions.loaded, ...payload], 'hash');
  },
  setTransactionByHash(state, transaction) {
    const index = state.transactions.loaded.findIndex((t) => t.hash === transaction.hash);
    if (index !== -1) state.transactions.loaded[index] = transaction;
  },
  setTipWithdrawnTransactions(state, payload) {
    state.transactions.tipWithdrawnTransactions = payload;
  },
  initTransactions(state) {
    state.transactions.loaded = [];
    state.transactions.nextPageUrl = '';
    state.transactions.tipWithdrawnTransactions = [];
    state.transactions.pending = [];
  },
  setTransactionsNextPage(state, pageUrl) {
    state.transactions.nextPageUrl = pageUrl;
  },
  addPendingTransaction(state, { transaction, network }) {
    state.transactions.pending[network] = [
      ...(state.transactions.pending[network] || []),
      transaction,
    ];
  },
  removePendingTransactionByHash(state, { network, hash }) {
    state.transactions.pending[network] = state.transactions.pending?.[network]
      ?.filter((t) => t.hash !== hash);
  },
  setPendingTransactionSentByHash(state, { network, hash }) {
    const index = state.transactions.pending[network].findIndex((t) => t.hash === hash);
    state.transactions.pending[network][index][TX_DIRECTION.sent] = true;
  },
  setUserNetwork(state, { index, ...network }) {
    if (index !== undefined) {
      state.userNetworks[index] = network;
    } else {
      state.userNetworks.push(network);
    }
  },
  deleteUserNetwork(state, index) {
    state.userNetworks = state.userNetworks.filter((el, idx) => idx !== index);
  },
  setNodeStatus(state, payload) {
    state.nodeStatus = payload;
  },
  setNotificationSettings(state, payload) {
    state.notificationSettings = payload;
  },
  toggleNotificationSetting(state, type) {
    const index = state.notificationSettings.findIndex((n) => n.type === type);
    state.notificationSettings[index].checked = !state.notificationSettings[index].checked;
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
