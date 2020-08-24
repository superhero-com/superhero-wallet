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
  currentCurrencyRate: ({ current: { currency }, currencies }) => currencies[currency] || 0,
  balanceCurrency({ balance }, { currentCurrencyRate }) {
    return (currentCurrencyRate * balance).toFixed(2);
  },
  formatCurrency: ({ current: { currency } }) => value =>
    // TODO: Use the current language from i18n module
    new Intl.NumberFormat(navigator.language, { style: 'currency', currency }).format(value),
  minTipAmount: ({ currencies: { usd } }) => 0.01 / usd,
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
