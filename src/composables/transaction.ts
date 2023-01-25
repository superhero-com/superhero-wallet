import {
  computed,
  ref,
} from '@vue/composition-api';
import { camelCase } from 'lodash-es';
import type { Store } from 'vuex';
import { TranslateResult } from 'vue-i18n';
import { SCHEMA } from '@aeternity/aepp-sdk';
import type {
  IDexContracts,
  IAccount,
  IAccountLabeled,
  ITransaction,
  ITokenList,
  ITokenResolved,
  TransactionType,
  INetwork,
  TxFunctionRaw,
  TxFunctionParsed,
} from '../types';
import { i18n } from '../store/plugins/languages';
import { transactionTokenInfoResolvers } from '../popup/utils/transactionTokenInfoResolvers';
import {
  AETERNITY_SYMBOL,
  FUNCTION_TYPE_DEX,
  MAGNITUDE,
  RETURN_TYPE_OK,
  TRANSACTION_OWNERSHIP_STATUS,
  TX_FUNCTIONS,
  TX_TYPE_MDW,
  AENS,
  DEX,
  convertToken,
} from '../popup/utils';

interface UseTransactionOptions {
  /**
   * TODO: Temporary solution to avoid dependency circle
   */
  store: Store<any>
  initTransaction?: ITransaction
  showDetailedAllowanceInfo?: boolean,
  defaultLabels?: string[],
}

export function useTransaction({
  store,
  initTransaction,
  showDetailedAllowanceInfo = false,
  defaultLabels = [],
}: UseTransactionOptions) {
  const transaction = ref<ITransaction | undefined>(initTransaction);

  async function setTransaction(newTransaction: ITransaction) {
    transaction.value = newTransaction;
  }

  const availableTokens = computed<ITokenList>(
    () => (store.state as any).fungibleTokens.availableTokens,
  );

  const account = computed<IAccount>(() => store.getters.account);
  const accounts = computed<IAccount[]>(() => store.getters.accounts);
  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);

  const isTxAex9 = computed(() => store.getters.isTxAex9);
  const getTxAmountTotal = computed(() => store.getters.getTxAmountTotal);
  const getTxSymbol = computed(() => store.getters.getTxSymbol);
  const getTxType = computed(() => store.getters.getTxType);
  const getTxDirection = computed(() => store.getters.getTxDirection);
  const getDexContracts = computed<IDexContracts>(() => store.getters.getDexContracts);
  const getExplorerPath = computed(() => store.getters.getExplorerPath);
  const getPreferred = computed(() => store.getters['names/getPreferred']);

  const txType = computed<TransactionType>(() => getTxType.value(transaction.value));

  const isMultisig = computed<boolean>(
    // Need a better way go know if this is a multisig tx
    () => !!(transaction.value?.tx as any).tx?.tx?.type,
  );
  const isAllowance = computed((): boolean => (
    !!transaction.value
    && FUNCTION_TYPE_DEX.allowance.includes(transaction.value.tx.function as TxFunctionRaw)
    && !!availableTokens.value[transaction.value.tx.contractId]
  ));

  const txOwnerAddress = computed(() => (
    transaction.value?.tx.accountId
    || transaction.value?.tx.callerId
  ));

  const ownershipStatus = computed(
    () => {
      if (account.value?.address === txOwnerAddress.value) {
        return TRANSACTION_OWNERSHIP_STATUS.current;
      }
      if (accounts.value?.find(({ address }) => address === txOwnerAddress.value)) {
        return TRANSACTION_OWNERSHIP_STATUS.subAccount;
      }
      return TRANSACTION_OWNERSHIP_STATUS.other;
    },
  );

  const transactionFunction = computed(() => {
    if (transaction.value?.tx?.function) {
      const functionName = camelCase(transaction.value.tx.function) as TxFunctionParsed;

      // TODO this line needs refactoring in TransactionResolver
      return transactionTokenInfoResolvers[functionName];
    }
    return null;
  });

  const direction = computed(() => (
      transaction.value?.tx.function === TX_FUNCTIONS.claim
        ? TX_FUNCTIONS.received
        : getTxDirection.value(
          transaction.value,
          ownershipStatus.value !== TRANSACTION_OWNERSHIP_STATUS.current
            && txOwnerAddress.value,
        )
  ));

  const tokens = computed((): ITokenResolved[] => {
    if (
      transaction.value
      && transactionFunction.value
      && (!isAllowance.value || showDetailedAllowanceInfo)
    ) {
      return transactionFunction.value(transaction.value, availableTokens.value).tokens;
    }
    if (!transaction.value) return [];

    return [{
      ...transaction.value.tx || {},
      amount: isAllowance.value
        ? convertToken(transaction.value.tx.fee, -MAGNITUDE)
        : getTxAmountTotal.value(transaction.value),
      symbol: isAllowance.value ? AETERNITY_SYMBOL : getTxSymbol.value(transaction.value),
      isReceived: direction.value === TX_FUNCTIONS.received,
      isAe:
        isAllowance.value
        || (
          getTxSymbol.value(transaction.value) === AETERNITY_SYMBOL
          && !isTxAex9.value(transaction.value)
        ),
    }];
  });

  const isErrorTransaction = computed(
    (): boolean => {
      if (!transaction.value) {
        return false;
      }
      const { returnType } = transaction.value.tx;
      return !!(returnType && returnType !== RETURN_TYPE_OK);
    },
  );

  const isDex = computed((): boolean => !!(transaction.value
    && getDexContracts.value && transaction.value.tx.contractId && (
    getDexContracts.value.router.includes(transaction.value.tx.contractId)
    || getDexContracts.value.wae.includes(transaction.value.tx.contractId)
  )));

  const labels = computed<(string | TranslateResult)[]>(() => {
    if (!transaction.value?.tx) return defaultLabels;

    const transactionTypes = i18n.t('transaction.type') as Record<TransactionType, TranslateResult>;

    if (txType.value?.startsWith('name')) {
      return [AENS, transactionTypes[txType.value]];
    }
    if (txType.value === SCHEMA.TX_TYPE.spend) {
      return [
        i18n.t('transaction.type.spendTx'),
        getTxDirection.value(transaction) === TX_FUNCTIONS.received
          ? i18n.t('transaction.spendType.out')
          : i18n.t('transaction.spendType.in'),
      ];
    }
    if (isAllowance.value) {
      return [i18n.t('transaction.dexType.allow_token')];
    }
    if (isDex.value) {
      return [
        DEX,
        FUNCTION_TYPE_DEX.pool.includes(transaction.value.tx.function as TxFunctionRaw)
          ? i18n.t('transaction.dexType.pool')
          : i18n.t('transaction.dexType.swap'),
      ];
    }
    if (
      (
        transaction.value.tx.contractId
        && (
          activeNetwork.value.tipContractV1 === transaction.value.tx.contractId
          || activeNetwork.value.tipContractV2 === transaction.value.tx.contractId
        )
        && (
          transaction.value.tx.function === TX_FUNCTIONS.tip
          || transaction.value.tx.function === TX_FUNCTIONS.retip
        )
      )
      || transaction.value.claim
    ) {
      return [
        i18n.t('pages.token-details.tip'),
        transaction.value.claim
          ? i18n.t('transaction.spendType.in')
          : i18n.t('transaction.spendType.out'),
      ];
    }
    if (
      txType.value === SCHEMA.TX_TYPE.contractCall
      && availableTokens.value[transaction.value.tx.contractId]
      && (transaction.value.tx.function === TX_FUNCTIONS.transfer || transaction.value.incomplete)
    ) {
      return [
        i18n.t('transaction.type.spendTx'),
        transaction.value.tx.callerId === account.value.address
          ? i18n.t('transaction.spendType.out')
          : i18n.t('transaction.spendType.in'),
      ];
    }

    // if (isMultisig) {
    //   return [
    //     // 'Contract Call',
    //     // 'Multisig Proposal',
    //     ...txTypes.value,
    //   ];
    // }

    if (txType.value === TX_TYPE_MDW.PayingForTx) {
      return [
        i18n.t('transaction.type.payingForTx'),
      ];
    }

    return transaction.value.pending ? [] : [transactionTypes[txType.value]];
  });

  function getOwnershipAccount(
    externalOwnerAddress: string | undefined,
  ): IAccountLabeled {
    switch (ownershipStatus.value) {
      case TRANSACTION_OWNERSHIP_STATUS.current:
        return {
          ...account.value,
          label: i18n.t('transaction.overview.accountAddress'),
          url: getExplorerPath.value(account.value.address),
        };
      case TRANSACTION_OWNERSHIP_STATUS.subAccount: {
        const { accountId, callerId } = transaction.value?.tx || {};

        return accounts.value.find(({ address }) => [accountId, callerId].includes(address))!;
      }
      default: {
        const address = externalOwnerAddress || txOwnerAddress.value;

        return {
          name: getPreferred.value(address) || '',
          address,
        };
      }
    }
  }

  return {
    txType,
    tokens,
    isAllowance,
    isErrorTransaction,
    isDex,
    isMultisig,
    txOwnerAddress,
    ownershipStatus,
    direction,
    getOwnershipAccount,
    setTransaction,
    labels,
  };
}
