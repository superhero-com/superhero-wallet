import { isEmpty } from 'lodash-es';
import { defaultNetwork } from '../popup/utils/constants';

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
  networks({ userNetworks }) {
    return [
      defaultNetwork,
      ...userNetworks.map((network, index) => ({ index, ...network })),
    ].reduce((acc, n) => ({ ...acc, [n.name]: n }), {});
  },
  activeNetwork({ current: { network } }, { networks }) {
    return networks[network];
  },
  mainnet(state, { activeNetwork }) {
    return activeNetwork.networkId === 'ae_mainnet';
  },
  activeAccountName({ account }, getters) {
    return getters['names/getDefault'](account.publicKey) || 'Main account';
  },
  allowTipping(state, { mainnet }) {
    return mainnet || process.env.RUNNING_IN_TESTS;
  },
  tokenBalance(state) {
    return state.current.token !== 0
      ? state.tokens[state.current.token].balance.toFixed(2)
      : state.balance.toFixed(2);
  },
};
