import BigNumber from 'bignumber.js';
import { generateHDWallet as generateHdWallet } from '@aeternity/hd-wallet/src';
import { mnemonicToSeed } from '@aeternity/bip39';
import { toShiftedBigNumber } from '@/utils';
import {
  ACCOUNT_HD_WALLET,
  NETWORK_MAINNET,
  NETWORK_TESTNET,
  NODE_STATUS_CONNECTED,
  TX_DIRECTION,
  getHdWalletAccount,
} from '@/popup/utils';
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
