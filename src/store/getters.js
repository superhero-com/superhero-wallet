import BigNumber from 'bignumber.js';
import { generateHDWallet as generateHdWallet } from '@aeternity/hd-wallet/src';
import { mnemonicToSeed } from '@aeternity/bip39';
import { Tag } from '@aeternity/aepp-sdk';
import { toShiftedBigNumber } from '@/utils';
import {
  NETWORK_MAINNET,
  NETWORK_TESTNET,
  NODE_STATUS_CONNECTED,
  ACCOUNT_HD_WALLET,
  TX_DIRECTION,
  getHdWalletAccount,
  PROTOCOL_AETERNITY,
} from '@/popup/utils';
import { useAeSdk } from '@/composables';
import { AE_SYMBOL } from '@/protocols/aeternity/config';
import {
  aettosToAe,
  categorizeContractCallTxObject,
} from '@/protocols/aeternity/helpers';

export default {
  wallet({ mnemonic }) {
    if (!mnemonic) return null;
    return generateHdWallet(mnemonicToSeed(mnemonic));
  },
  accounts({ accounts: { list } }, getters) {
    if (!getters.wallet) return [];
    return list
      .map(({
        idx, type, protocol, ...acc
      }) => ({
        idx,
        type,
        protocol: protocol || PROTOCOL_AETERNITY,
        ...acc,
        ...(type === ACCOUNT_HD_WALLET ? getHdWalletAccount(getters.wallet, idx) : {}),
        protocol: 'aeternity',
      }))
      .map(({ ...account }) => ({
        ...account,
        name: getters['names/getDefault'](account.address),
      }));
  },
  account({ accounts: { activeIdx } }, { accounts }) {
    return accounts[activeIdx] || {}; // TODO: Return null
  },
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
  getTx: (state, getters) => (hash) => {
    const { nodeNetworkId } = useAeSdk({ store: { state, getters } });
    return state.transactions.loaded
      .concat(state.transactions.pending[nodeNetworkId.value])
      ?.find((tx) => tx?.hash === hash);
  },
  getTxSymbol: ({ fungibleTokens: { availableTokens } }) => (transaction) => {
    if (transaction.pendingTokenTx) return availableTokens[transaction.tx.contractId]?.symbol;
    const contractCallData = transaction.tx && categorizeContractCallTxObject(transaction);
    return availableTokens[contractCallData?.token]?.symbol || AE_SYMBOL;
  },
  getTxAmountTotal: (
    { fungibleTokens: { availableTokens } },
  ) => (transaction, direction = TX_DIRECTION.sent) => {
    const contractCallData = transaction.tx && categorizeContractCallTxObject(transaction);
    if (contractCallData && availableTokens[contractCallData.token]) {
      return +toShiftedBigNumber(
        contractCallData.amount,
        -availableTokens[contractCallData.token].decimals,
      );
    }
    const isReceived = direction === TX_DIRECTION.received;

    return +aettosToAe(
      new BigNumber(
        transaction.tx?.amount
        || transaction.tx?.tx?.tx?.amount
        || transaction.tx?.nameFee || 0,
      )
        .plus(isReceived ? 0 : transaction.tx?.fee || 0)
        .plus(isReceived ? 0 : transaction.tx?.tx?.tx?.fee || 0),
    );
  },
  getTxDirection: (_, { account: { address } }) => (tx, externalAddress = null) => {
    const currentAddress = externalAddress || address;

    if (tx.tag === Tag.SpendTx) {
      return tx.senderId === currentAddress
        ? TX_DIRECTION.sent
        : TX_DIRECTION.received;
    }

    return ['senderId', 'accountId', 'ownerId', 'callerId', 'payerId']
      .map((key) => tx?.[key])
      .includes(currentAddress)
      ? TX_DIRECTION.sent
      : TX_DIRECTION.received;
  },
  getAccountPendingTransactions: (state, getters) => {
    const { nodeNetworkId } = useAeSdk({ store: { state, getters } });
    const { address } = getters.account;
    const pendingTransactions = state.transactions.pending[nodeNetworkId.value];

    if (pendingTransactions?.length) {
      return pendingTransactions.filter(({ tx, recipient, recipientId }) => [
        tx.callerId, tx.senderId, tx.recipientId, recipientId, recipient,
      ].includes(address));
    }

    return [];
  },
};
