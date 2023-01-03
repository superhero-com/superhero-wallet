import { computed, ref } from '@vue/composition-api';
import { camelCase } from 'lodash-es';
import type { Store } from 'vuex';
import type {
  ITransaction, ITokenList, ITx, TransactionType, IDexContracts,
} from '../types';
import * as TransactionResolver from '../popup/utils/transactionTokenInfoResolvers';
import {
  AETERNITY_SYMBOL,
  FUNCTION_TYPE_DEX,
  MAGNITUDE,
  RETURN_TYPE_OK,
  convertToken,
} from '../popup/utils';

interface UseTransactionTokenOptions {
  /**
   * TODO: Temporary solution to avoid dependency circle
   */
  store: Store<any>
  initTransaction?: ITransaction
  showDetailedAllowanceInfo?: boolean
}

interface ITokenTransactionComposable extends ITx {
  decimals?: number,
  amount: number,
  symbol: string,
  isReceived: string,
  isAe: string
}

export function useTransactionToken({
  store,
  initTransaction,
  showDetailedAllowanceInfo = false,
}: UseTransactionTokenOptions) {
  const transaction = ref<ITransaction | undefined>(initTransaction);

  function setTransaction(newTransaction: ITransaction) {
    transaction.value = newTransaction;
  }

  const fungibleTokens = computed(() => store.state.fungibleTokens);
  const availableTokens = computed<ITokenList>(() => fungibleTokens.value.availableTokens);

  const getTxAmountTotal = computed(() => store.getters.getTxAmountTotal);
  const isTxAex9 = computed(() => store.getters.isTxAex9);

  const getTxSymbol = computed(() => store.getters.getTxSymbol);
  const getTxType = computed(() => store.getters.getTxType);
  const getTxDirection = computed(() => store.getters.getTxDirection);
  const getDexContracts = computed<IDexContracts>(() => store.getters.getDexContracts);

  const txType = computed<TransactionType>(() => getTxType.value(transaction.value));

  const isAllowance = computed(() => transaction.value
    && FUNCTION_TYPE_DEX.allowance.includes(transaction.value.tx.function)
    && availableTokens.value[transaction.value.tx.contractId]);

  const transactionFunction = computed(() => {
    if (transaction.value) {
      const functionName = camelCase(transaction.value.tx.function || '');

      // TODO this line needs refactoring in TransactionResolver
      // @ts-ignore
      return TransactionResolver[functionName as string];
    }
    return null;
  });

  const tokens = computed<ITokenTransactionComposable[]>(() => {
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
      isReceived: getTxDirection.value(transaction.value) === 'received',
      isAe:
        isAllowance.value
        || (
          getTxSymbol.value(transaction.value) === AETERNITY_SYMBOL
          && !isTxAex9.value(transaction.value)
        ),
    }];
  });

  const isErrorTransaction = computed<boolean>(
    () => {
      if (!transaction.value) return false;
      const { returnType } = transaction.value.tx;
      return !!(returnType && returnType !== RETURN_TYPE_OK);
    },
  );

  const isDex = computed(() => transaction.value
    && getDexContracts.value && transaction.value.tx.contractId && (
    getDexContracts.value.router.includes(transaction.value.tx.contractId)
    || getDexContracts.value.wae.includes(transaction.value.tx.contractId)
  ));

  return {
    txType,
    tokens,
    isAllowance,
    isErrorTransaction,
    isDex,
    availableTokens,
    getTxAmountTotal,
    getTxSymbol,
    getTxType,
    getTxDirection,
    getDexContracts,
    setTransaction,
  };
}
