import BigNumber from 'bignumber.js';
import { mnemonicToSeed } from '@aeternity/bip39';
import { toShiftedBigNumber } from '@/utils';
import {
  ACCOUNT_HD_WALLET,
  NODE_STATUS_CONNECTED,
  PROTOCOL_AETERNITY,
  TX_DIRECTION,
} from '@/constants';
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
    if (!getters.wallet) {
      return [];
    }

    return list
      .map(({
        idx, type, protocol = PROTOCOL_AETERNITY, ...acc
      }, index) => ({
        globalIdx: index,
        idx,
        type,
        protocol,
        ...acc,
        ...(type === ACCOUNT_HD_WALLET
          ? ProtocolAdapterFactory
            .getAdapter(protocol)
            .getHdWalletAccountFromMnemonicSeed(
              getters.wallet,
              idx,
            )
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
};
