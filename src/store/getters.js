export const getters = {
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
    return (current.currencyRate * balance).toFixed(3);
  },
  currentCurrency({ current }) {
    return current.currency.toUpperCase();
  },
  network(state) {
    return state.network;
  },
  userNetworks(state) {
    return state.userNetworks;
  },
  current(state) {
    return state.current;
  },
  popup(state) {
    return state.popup;
  },
  isLoggedIn(state) {
    return state.isLoggedIn;
  },
  transactions(state) {
    return state.transactions;
  },
  wallet(state) {
    return state.wallet;
  },
  activeAccount(state) {
    return state.activeAccount;
  },
  activeAccountName(state) {
    const account = state.subaccounts.find(s => s.publicKey === state.account.publicKey);
    return account ? (account.aename ? account.aename : account.name) : 'Main Account';
  },
  sdk(state) {
    return state.sdk;
  },
  tokenBalance(state) {
    return state.current.token != 0 ? state.tokens[state.current.token].balance.toFixed(3) : state.balance.toFixed(3);
  },
  tokenSymbol() {
    return 'æid';
  },
  aeppPopup(state) {
    return state.aeppPopup;
  },
  ledgerApi(state) {
    return state.ledgerApi;
  },
  isLedger(state) {
    if (state.subaccounts.length > 0) {
      return state.subaccounts.find(s => s.publicKey == state.account.publicKey).isLedger;
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
};
