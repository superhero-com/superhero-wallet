
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
    return state.subaccounts.find(s => s.publicKey == state.account.publicKey) ? state.subaccounts.find(s => s.publicKey == state.account.publicKey).name : 'Account';
  },
  sdk(state) {
    return state.sdk
  },
  tokenBalance(state) {
    return state.current.token != 0 ? state.tokens[state.current.token].balance : state.balance
  },
  tokenSymbol() {
    return 'AE'
  },
  aeppPopup(state) {
    return state.aeppPopup
  },
  ledgerApi(state) {
    return state.ledgerApi
  },
  ledgerNextIdx(state) {
    return Math.max(
      ...state.subaccounts.filter(a => a.isLedger).map(({ idx }) => idx),
      -1,
    ) + 1
  },
  isLedger(state) {
    if(state.subaccounts.length > 0){
      return state.subaccounts.find(s => s.publicKey == state.account.publicKey).isLedger
    } else{
      return state.subaccounts
    }
  },
  getActiveAccount(state) {
    return state.subaccounts.find(s => s.publicKey == state.account.publicKey)
  },
  background({ background }) {
    return background
  },
  txAdvancedMode({ txAdvancedMode }) {
    return txAdvancedMode
  },
  tipping({ tipping }) {
    return tipping
  },
  tippingReceiver({ tippingReceiver }) {
    return tippingReceiver
  }
};
