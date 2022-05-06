import BigNumber from 'bignumber.js';
import { derivePathFromKey, getKeyPair } from '@aeternity/hd-wallet/src/hd-key';
import { generateHDWallet as generateHdWallet } from '@aeternity/hd-wallet/src';
import { mnemonicToSeed } from '@aeternity/bip39';
import { TxBuilderHelper, SCHEMA } from '@aeternity/aepp-sdk';
import { defaultNetworks, TX_TYPE_MDW } from '../popup/utils/constants';
import {
  checkHashType,
  convertToken,
  aettosToAe,
  categorizeContractCallTxObject,
} from '../popup/utils/helper';
import { i18n } from './plugins/languages';

const getHdWalletAccount = (wallet, accountIdx = 0) => {
  const keyPair = getKeyPair(derivePathFromKey(`${accountIdx}h/0h/0h`, wallet).privateKey);
  return {
    ...keyPair,
    idx: accountIdx,
    address: TxBuilderHelper.encode(keyPair.publicKey, 'ak'),
  };
};

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
      .map(({ idx, localName, ...account }) => ({
        idx,
        ...account,
        name: getters['names/getDefault'](account.address),
        localName:
          localName || (idx === 0 ? i18n.t('mainAccount') : i18n.t('subaccountName', { idx })),
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
    navigator.language, { style: 'currency', currency },
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
  getTx: ({ transactions }) => (hash) => transactions.loaded
    .concat(transactions.pending.map((t) => ({ ...t, pending: true })))
    .find((tx) => tx.hash === hash),
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
        && TxBuilderHelper.decode(transaction.tx.log[0].data).toString())
      || categorizeContractCallTxObject(transaction)?.url
      || ''
  ),
  isTxAex9: () => (transaction) => transaction.tx
    && !!categorizeContractCallTxObject(transaction)?.token,
};
