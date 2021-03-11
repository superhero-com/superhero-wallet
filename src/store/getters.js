import { isEmpty } from 'lodash-es';
import { defaultNetworks } from '../popup/utils/constants';

export default {
  account({ account }, getters) {
    if (!isEmpty(account)) {
      return {
        ...account,
        name: getters['names/getDefault'](account.publicKey),
        type: 'Main account',
      };
    }
    return account;
  },
  currentCurrencyRate: ({ current: { currency }, currencies }) => currencies[currency] || 0,
  convertToCurrency: (state, { currentCurrencyRate }) => (value) =>
    +(currentCurrencyRate * value).toFixed(2),
  formatCurrency: ({ current: { currency } }) => (value) =>
    // TODO: Use the current language from i18n module
    new Intl.NumberFormat(navigator.language, { style: 'currency', currency }).format(value),
  convertToCurrencyFormatted: (state, { convertToCurrency, formatCurrency }) => (value) =>
    formatCurrency(convertToCurrency(value)),
  minTipAmount: ({ currencies: { usd } }) => 0.01 / usd,
  networks({ userNetworks }) {
    return [
      ...defaultNetworks,
      ...userNetworks.map((network, index) => ({ index, ...network })),
    ].reduce((acc, n) => ({ ...acc, [n.name]: n }), {});
  },
  activeNetwork({ current: { network } }, { networks }) {
    return networks[network];
  },
  getProfileImage: (_, { activeNetwork }) => (address) =>
    `${activeNetwork.backendUrl}/profile/image/${address}`,
  getAvatar: () => (address) => `https://avatars.z52da5wt.xyz/${address}`,
  tippingSupported(state, { activeNetwork }) {
    return (
      ['ae_mainnet', 'ae_uat'].includes(activeNetwork.networkId) || process.env.RUNNING_IN_TESTS
    );
  },
};
