import { DEFAULT_NETWORK } from '../popup/utils/constants';

export default {
  account(state) {
    return state.account;
  },
  subaccounts(state) {
    return state.subaccounts;
  },
  balance(state) {
    return state.balance;
  },
  balanceCurrency({ current, balance }) {
    return (current.currencyRate * balance).toFixed(2);
  },
  currentCurrency({ current }) {
    return current.currency.toUpperCase();
  },
  network(state) {
    return state.network;
  },
  networks({ network }) {
    const networks = { ...network };
    networks[DEFAULT_NETWORK].system = true;
    return networks;
  },
  userNetworks(state) {
    return state.userNetworks;
  },
  current(state) {
    return state.current;
  },
  isLoggedIn(state) {
    return state.isLoggedIn;
  },
  transactions(state) {
    return state.transactions;
  },
  pendingTransactions(state) {
    return state.transactions.pending;
  },
  wallet(state) {
    return state.wallet;
  },
  activeAccount(state) {
    return state.activeAccount;
  },
  activeAccountName(state) {
    const account = state.subaccounts.find(s => s.publicKey === state.account.publicKey);
    return account.aename ? account.aename : account.name;
  },
  sdk(state) {
    return state.sdk;
  },
  middleware(state) {
    return state.middleware;
  },
  tokenBalance(state) {
    return state.current.token !== 0
      ? state.tokens[state.current.token].balance.toFixed(2)
      : state.balance.toFixed(2);
  },
  tokenSymbol() {
    return 'AE';
  },
  aeppPopup(state) {
    return state.aeppPopup;
  },
  ledgerApi(state) {
    return state.ledgerApi;
  },
  isLedger(state) {
    if (state.subaccounts.length > 0) {
      return state.subaccounts.find(s => s.publicKey === state.account.publicKey).isLedger;
    }
    return state.subaccounts;
  },
  txAdvancedMode({ txAdvancedMode }) {
    return txAdvancedMode;
  },
  tipping({ tipping }) {
    return tipping;
  },
  tippingReceiver({ tippingReceiver }) {
    return tippingReceiver;
  },
  mainLoading({ mainLoading }) {
    return mainLoading;
  },
  nodeStatus({ nodeStatus }) {
    return nodeStatus;
  },
  currencies({ currencies }) {
    return currencies;
  },
  notifications({ notifications }) {
    return notifications;
  },
  notificationsCounter({ notificationsCounter }) {
    return notificationsCounter;
  },
  names({ names }) {
    return names;
  },
  tip({ tip }) {
    return tip;
  },
  mnemonic({ mnemonic }) {
    return mnemonic;
  },
  backedUpSeed({ backedUpSeed }) {
    return backedUpSeed;
  },
};
