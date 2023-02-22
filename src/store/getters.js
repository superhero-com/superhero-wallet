import BigNumber from 'bignumber.js';
import { generateHDWallet as generateHdWallet } from '@aeternity/hd-wallet/src';
import { mnemonicToSeed } from '@aeternity/bip39';
import { SCHEMA } from '@aeternity/aepp-sdk';
import {
  AETERNITY_SYMBOL,
  DEX_CONTRACTS,
  NETWORK_ID_MAINNET,
  NETWORK_ID_TESTNET,
  NETWORK_MAINNET,
  NETWORK_TESTNET,
  NODE_STATUS_CONNECTED,
  TX_FUNCTIONS,
  ACCOUNT_HD_WALLET,
  validateHash,
  convertToken,
  aettosToAe,
  categorizeContractCallTxObject,
  getHdWalletAccount,
  getMdwEndpointPrefixForHash,
  getTxType,
} from '../popup/utils';

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
        ...(type === ACCOUNT_HD_WALLET ? getHdWalletAccount(getters.wallet, idx) : {}),
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
    navigator.language, { style: 'currency', currencyDisplay: 'narrowSymbol', currency },
  ).format(value),
  convertToCurrencyFormatted: (state, { convertToCurrency, formatCurrency }) => (value) => (
    formatCurrency(convertToCurrency(value))),
  minTipAmount: ({ currencies: { usd } }) => 0.01 / usd,
  networks({ userNetworks }) {
    return [
      NETWORK_MAINNET,
      NETWORK_TESTNET,
      ...userNetworks.map((network, index) => ({ index, ...network })),
    ].reduce((acc, n) => ({ ...acc, [n.name]: n }), {});
  },
  activeNetwork({ current: { network } }, { networks }) {
    return networks[network];
  },
  isConnected({ nodeStatus }) {
    return nodeStatus === NODE_STATUS_CONNECTED;
  },
  tippingSupported(state, { activeNetwork }) {
    return (
      [NETWORK_ID_MAINNET, NETWORK_ID_TESTNET].includes(activeNetwork.networkId)
      || process.env.RUNNING_IN_TESTS
    );
  },
  getExplorerPath: (_, { activeNetwork: { explorerUrl } }) => (hash) => {
    const { valid } = validateHash(hash);
    if (!valid) {
      return null;
    }
    const endpoint = getMdwEndpointPrefixForHash(hash);
    return `${explorerUrl}/${endpoint}/${hash}`;
  },
  getTx: ({ transactions }, { activeNetwork }) => (hash) => transactions.loaded
    .concat(transactions.pending[activeNetwork.networkId])?.find((tx) => tx?.hash === hash),

  getTxSymbol: ({ fungibleTokens: { availableTokens } }) => (transaction) => {
    if (transaction.pendingTokenTx) return availableTokens[transaction.tx.contractId]?.symbol;
    const contractCallData = transaction.tx && categorizeContractCallTxObject(transaction);
    return availableTokens[contractCallData?.token]?.symbol || AETERNITY_SYMBOL;
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
        transaction.tx?.amount || transaction.tx?.nameFee || 0,
      ).plus(transaction.tx?.fee || 0),
    );
  },
  getTxDirection: (_, { account: { address } }) => (tx, externalAddress) => {
    if (getTxType(tx) === SCHEMA.TX_TYPE.spend) {
      return tx.recipientId === address
        ? TX_FUNCTIONS.received
        : TX_FUNCTIONS.sent;
    }
    return ['senderId', 'accountId', 'ownerId', 'callerId', 'payerId']
      .map((key) => tx?.[key])
      .includes(externalAddress || address)
      ? TX_FUNCTIONS.sent
      : TX_FUNCTIONS.received;
  },
  getDexContracts: (_, { activeNetwork }) => (DEX_CONTRACTS[activeNetwork.networkId]),
  getAmountFiat: (_, { convertToCurrency, formatCurrency }) => (amount) => {
    const converted = convertToCurrency(amount);
    if (converted < 0.01) return `<${formatCurrency(0.01)}`;
    return `${formatCurrency(converted)}`;
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
