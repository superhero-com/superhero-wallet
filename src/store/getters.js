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
  balanceCurrency({ current, balance }) {
    return (current.currencyRate * balance).toFixed(2);
  },
  currentCurrency({ current }) {
    return current.currency.toUpperCase();
  },
  activeNetwork({ current, network }) {
    return network[current.network] || {};
  },
  networks({ network }) {
    const networks = { ...network };
    networks[DEFAULT_NETWORK].system = true;
    return networks;
  },
  activeAccountName({ account }, getters) {
    return getters['names/getDefault'](account.publicKey) || 'Main account';
  },
  allowTipping(state, { mainnet }) {
    return mainnet || process.env.RUNNING_IN_TESTS;
  },
  mainnet({ network, current }) {
    return network[current.network].networkId === 'ae_mainnet';
  },
  tokenBalance(state) {
    return state.current.token !== 0
      ? state.tokens[state.current.token].balance.toFixed(2)
      : state.balance.toFixed(2);
  },
};
