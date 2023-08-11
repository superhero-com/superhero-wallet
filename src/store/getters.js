import BigNumber from 'bignumber.js';
import { mnemonicToSeed } from '@aeternity/bip39';
import { toShiftedBigNumber } from '@/utils';
import {
  ACCOUNT_HD_WALLET,
  NODE_STATUS_CONNECTED,
  PROTOCOLS,
  PROTOCOL_AETERNITY,
  TX_DIRECTION,
} from '@/constants';
import { useAccounts, useAeSdk } from '@/composables';
import { AE_SYMBOL } from '@/protocols/aeternity/config';
import {
  aettosToAe,
  categorizeContractCallTxObject,
} from '@/protocols/aeternity/helpers';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

export default {
  wallet({ mnemonic }) {
    if (!mnemonic) return null;
    return mnemonicToSeed(mnemonic);
  },
  accounts({ accounts: { list } }, getters) {
    if (!getters.wallet) return [];

    const protocolIdx = PROTOCOLS.reduce((acc, protocol) => ({ ...acc, [protocol]: 0 }), {});

    return list
      .map(({
        idx, type, protocol = PROTOCOL_AETERNITY, ...acc
      }) => ({
        idx,
        type,
        protocol,
        ...acc,
        ...(type === ACCOUNT_HD_WALLET
          ? ProtocolAdapterFactory
            .getAdapter(protocol)
            // eslint-disable-next-line no-plusplus
            .getHdWalletAccountFromMnemonicSeed(getters.wallet, protocolIdx[protocol]++)
          : {}
        ),
      }))
      .map(({ ...account }) => ({
        ...account,
        name: getters['names/getDefault'](account.address),
      }));
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
  getAccountPendingTransactions: (state, getters) => {
    const store = { state, getters };
    const { nodeNetworkId } = useAeSdk({ store });
    const { activeAccount } = useAccounts({ store });
    const pendingTransactions = state.transactions.pending[nodeNetworkId.value];

    if (pendingTransactions?.length) {
      return pendingTransactions.filter(({ tx, recipient, recipientId }) => [
        tx.callerId, tx.senderId, tx.recipientId, recipientId, recipient,
      ].includes(activeAccount.value.address));
    }

    return [];
  },
};
