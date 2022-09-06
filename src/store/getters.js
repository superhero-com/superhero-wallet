import BigNumber from 'bignumber.js';
import { generateHDWallet as generateHdWallet } from '@aeternity/hd-wallet/src';
import { mnemonicToSeed } from '@aeternity/bip39';
import { TxBuilderHelper, SCHEMA } from '@aeternity/aepp-sdk';
import {
  AVATAR_URL, defaultNetworks, TX_TYPE_MDW, DEX_CONTRACTS,
} from '../popup/utils/constants';
import {
  checkHashType,
  convertToken,
  aettosToAe,
  categorizeContractCallTxObject,
  getHdWalletAccount,
} from '../popup/utils/helper';

export default {
  wallet({ mnemonic }) {
    if (!mnemonic) return null;
    return generateHdWallet(mnemonicToSeed(mnemonic));
  },
  accounts({ accounts: { list } }, getters) {
    if (!getters.wallet) return [];
    return list
      .map(({ idx, type, ...acc }) => ({
        idx,
        type,
        ...acc,
        ...(type === 'hd-wallet' ? getHdWalletAccount(getters.wallet, idx) : {}),
      }))
      .map(({ ...account }) => ({
        ...account,
        name: getters['names/getDefault'](account.address),
      }));
  },
  account({ accounts: { activeIdx } }, { accounts }) {
    return accounts[activeIdx] || {}; // TODO: Return null
  },
  isLoggedIn: (state, { account }) => Object.keys(account).length > 0,
  currentCurrencyRate: ({ current: { currency }, currencies }) => currencies[currency] || 0,
  convertToCurrency: (state, { currentCurrencyRate }) => (value) => (
    +(currentCurrencyRate * value).toFixed(2)),
  // TODO: Use the current language from i18n module
  formatCurrency: ({ current: { currency } }) => (value) => new Intl.NumberFormat(
    navigator.language, { style: 'currency', currencyDisplay: 'symbol', currency },
  ).format(value),
  formatNumber: () => (value) => new Intl.NumberFormat(
    navigator.language,
  ).format(value),
  convertToCurrencyFormatted: (state, { convertToCurrency, formatCurrency }) => (value) => (
    formatCurrency(convertToCurrency(value))),
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
  getProfileImage: (_, { activeNetwork }) => (address) => `${activeNetwork.backendUrl}/profile/image/${address}`,
  getAvatar: () => (address) => `${AVATAR_URL}${address}`,
  tippingSupported(state, { activeNetwork }) {
    return (
      ['ae_mainnet', 'ae_uat'].includes(activeNetwork.networkId) || process.env.RUNNING_IN_TESTS
    );
  },
  getExplorerPath: (_, { activeNetwork: { explorerUrl } }) => (hash) => {
    const { endpoint, valid } = checkHashType(hash);
    return valid ? `${explorerUrl}/${endpoint}/${hash}` : null;
  },
  getTx: ({ transactions }, { activeNetwork }) => (hash) => transactions.loaded
    .concat(transactions.pending[activeNetwork.networkId])?.find((tx) => tx?.hash === hash),
  getTxType: () => (transaction) => transaction.tx
    && (TX_TYPE_MDW[transaction.tx.type]
      || SCHEMA.OBJECT_ID_TX_TYPE[transaction.tx.tag]
      || (Object.values(SCHEMA.TX_TYPE).includes(transaction.tx.type) && transaction.tx.type)),
  getTxSymbol: ({ fungibleTokens: { availableTokens } }) => (transaction) => {
    if (transaction.pendingTokenTx) return availableTokens[transaction.tx.contractId]?.symbol;
    const contractCallData = transaction.tx && categorizeContractCallTxObject(transaction);
    return contractCallData ? availableTokens[contractCallData.token]?.symbol : 'AE';
  },
  getTxAmountTotal: ({ fungibleTokens: { availableTokens } }) => (transaction) => {
    const contractCallData = transaction.tx && categorizeContractCallTxObject(transaction);
    if (contractCallData && availableTokens[contractCallData.token]) {
      return +convertToken(
        contractCallData.amount,
        -availableTokens[contractCallData.token].decimals,
      );
    }
    return +aettosToAe(
      new BigNumber(
        transaction.amount || transaction.tx?.amount
        || transaction.nameFee || transaction.tx?.nameFee || 0,
      ).plus(transaction.fee || transaction.tx?.fee || 0),
    );
  },
  getNameFee: () => (transaction) => +aettosToAe(
    new BigNumber(transaction.nameFee || transaction.tx?.nameFee || 0),
  ),
  getTxFee: () => (transaction) => +aettosToAe(
    new BigNumber(transaction.fee || transaction.tx?.fee || 0),
  ),
  getTxDirection: (_, { account: { address } }) => ({ tx }) => (['senderId', 'accountId', 'ownerId', 'callerId', 'payerId'].map((key) => tx?.[key]).includes(address)
    ? 'sent'
    : 'received'),
  getTxTipUrl: () => (transaction) => (
    transaction.tipUrl
      || transaction.url
      || (!transaction.pending
        && !transaction.claim
        && transaction.tx.log?.[0]
        && transaction.function === 'tip'
        && TxBuilderHelper.decode(transaction.tx.log[0].data).toString())
      || categorizeContractCallTxObject(transaction)?.url
      || ''
  ),
  isTxAex9: () => (transaction) => transaction.tx
    && !!categorizeContractCallTxObject(transaction)?.token,
  getDexContracts: (_, { activeNetwork }) => (DEX_CONTRACTS[activeNetwork.networkId]),
  getAmountFiat: (_, { convertToCurrency, formatCurrency }) => (amount) => {
    const converted = convertToCurrency(amount);
    if (converted < 0.01) return `<${formatCurrency(0.01)}`;
    return `≈${formatCurrency(converted)}`;
  },
  getAccountPendingTransactions: (
    { transactions: { pending } }, { activeNetwork, account: { address } },
  ) => (pending[activeNetwork.networkId]?.length ? pending[activeNetwork.networkId]
    ?.filter((transaction) => transaction.tx.callerId === address
    || transaction.tx.senderId === address
    || transaction.tx.recipientId === address
    || transaction.recipientId === address
    || transaction.recipient === address) : []),
};
