import { times } from 'lodash-es';
import { derivePathFromKey, getKeyPair } from '@aeternity/hd-wallet/src/hd-key';
import { generateHDWallet as generateHdWallet } from '@aeternity/hd-wallet/src';
import { mnemonicToSeed } from '@aeternity/bip39';
import { Crypto } from '@aeternity/aepp-sdk/es';
import { decode } from '@aeternity/aepp-sdk/es/tx/builder/helpers';
import { asBigNumber } from '@aeternity/aepp-sdk/es/utils/bignumber';
import { defaultNetworks } from '../popup/utils/constants';
import {
  checkHashType,
  convertToken,
  aettosToAe,
  categorizeContractCallTxObject,
} from '../popup/utils/helper';

const getHdWalletAccount = (wallet, accountIdx = 0) => {
  const keyPair = getKeyPair(derivePathFromKey(`${accountIdx}h/0h/0h`, wallet).privateKey);
  return {
    ...keyPair,
    idx: accountIdx,
    address: Crypto.aeEncodeKey(keyPair.publicKey),
  };
};

export default {
  wallet({ mnemonic }) {
    if (!mnemonic) return null;
    return generateHdWallet(mnemonicToSeed(mnemonic));
  },
  accounts({ accountCount }, getters) {
    if (!getters.wallet) return [];
    return times(accountCount)
      .map((idx) => getHdWalletAccount(getters.wallet, idx))
      .map((account) => ({
        ...account,
        name: getters['names/getDefault'](account.address),
        type: 'Main account',
      }));
  },
  account({ accountSelectedIdx }, { accounts }) {
    return accounts[accountSelectedIdx] || {}; // TODO: Return null
  },
  isLoggedIn: (state, { account }) => Object.keys(account).length > 0,
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
  getExplorerPath: (_, { activeNetwork: { explorerUrl } }) => (hash) => {
    const { endpoint, valid } = checkHashType(hash);
    return valid ? `${explorerUrl}/${endpoint}/${hash}` : null;
  },
  getTx: ({ transactions }) => (hash) => {
    return transactions.latest
      .concat(transactions.pending.map((t) => ({ ...t, pending: true })))
      .find((tx) => tx.hash === hash);
  },
  getTxType: (_, { getTxSymbol }) => (transaction) => {
    return getTxSymbol(transaction) === 'AE' ? transaction.tx.type : null;
  },
  getTxSymbol: ({ fungibleTokens: { availableTokens } }) => (transaction) => {
    const contractCallData = transaction.tx && categorizeContractCallTxObject(transaction);
    return contractCallData ? availableTokens[contractCallData.token].symbol : 'AE';
  },
  getTxAmountTotal: ({ fungibleTokens: { availableTokens } }) => (transaction) => {
    const contractCallData = transaction.tx && categorizeContractCallTxObject(transaction);
    if (contractCallData)
      return +convertToken(
        contractCallData.amount,
        -availableTokens[contractCallData.token].decimals,
      );
    return +aettosToAe(
      asBigNumber(
        // eslint-disable-next-line camelcase
        transaction.amount || transaction.tx?.amount || transaction.tx?.name_fee || 0,
      ).plus(transaction.fee || transaction.tx?.fee || 0),
    );
  },
  getTxDirection: (_, { account: { address } }) => ({ tx }) => {
    return ['senderId', 'accountId', 'ownerId', 'callerId'].map((key) => tx[key]).includes(address)
      ? 'sent'
      : 'received';
  },
  getTxTipUrl: () => (transaction) => {
    return (
      transaction.tipUrl ||
      transaction.url ||
      (!transaction.pending &&
        !transaction.claim &&
        transaction.tx.log?.[0] &&
        decode(transaction.tx.log[0].data).toString()) ||
      categorizeContractCallTxObject(transaction)?.url ||
      ''
    );
  },
};
