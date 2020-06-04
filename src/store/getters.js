import { isEmpty } from 'lodash-es';
import { DEFAULT_NETWORK } from '../popup/utils/constants';

export default {
  account(state, { activeAccountName }) {
    if (!isEmpty(state.account)) {
      return {
        ...state.account,
        name: activeAccountName.includes('.chain') ? activeAccountName : false,
      };
    }
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
  activeNetwork({ current, network }) {
    return network[current.network] || {};
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
  activeAccount(state) {
    return state.activeAccount;
  },
  activeAccountName({ account }, getters) {
    return getters['names/getDefault'](account.publicKey) || 'Main account';
  },
  allowTipping(state, { mainnet }) {
    return mainnet || process.env.RUNNING_IN_TESTS;
  },
  mainnet(state, { network, current }) {
    return network[current.network].networkId === 'ae_mainnet';
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
  aeppPopup(state) {
    return state.aeppPopup;
  },
  isLedger(state) {
    if (state.subaccounts.length > 0) {
      return state.subaccounts.find(s => s.publicKey === state.account.publicKey).isLedger;
    }
    return state.subaccounts;
  },
  tipping({ tipping }) {
    return tipping;
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
