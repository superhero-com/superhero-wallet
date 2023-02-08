import { computed } from '@vue/composition-api';
import { camelCase } from 'lodash-es';
import type {
  IDefaultComposableOptions,
  ITokenList,
  ITokenResolved,
  ITransaction,
  TxFunctionParsed,
} from '../types';
import {
  AETERNITY_SYMBOL,
  convertToken,
  MAGNITUDE,
  TX_FUNCTIONS,
} from '../popup/utils';
import { transactionTokenInfoResolvers } from '../popup/utils/transactionTokenInfoResolvers';

interface UseTransactionTokensOptions extends IDefaultComposableOptions {
  transaction: ITransaction
  direction: string
  isAllowance: boolean
  showDetailedAllowanceInfo?: boolean
}

export function useTransactionTokens({
  store,
  direction,
  isAllowance,
  transaction,
  showDetailedAllowanceInfo = false,
}: UseTransactionTokensOptions) {
  const isTxAex9 = computed(() => store.getters.isTxAex9);
  const getTxSymbol = computed(() => store.getters.getTxSymbol);
  const getTxAmountTotal = computed(() => store.getters.getTxAmountTotal);

  const availableTokens = computed<ITokenList>(
    () => (store.state as any).fungibleTokens.availableTokens,
  );

  const transactionFunction = computed(() => {
    if (transaction?.tx.function) {
      const functionName = camelCase(transaction.tx.function) as TxFunctionParsed;

      // TODO this line needs refactoring in TransactionResolver
      return transactionTokenInfoResolvers[functionName];
    }
    return null;
  });

  const tokens = computed((): ITokenResolved[] => {
    if (
      transaction?.tx
      && transactionFunction.value
      && (!isAllowance || showDetailedAllowanceInfo)
    ) {
      return transactionFunction.value(
        transaction,
        availableTokens.value,
      ).tokens;
    }
    if (!transaction) return [];

    return [{
      ...transaction.tx || {},
      amount: isAllowance
        ? convertToken(transaction.tx?.fee || 0, -MAGNITUDE)
        : getTxAmountTotal.value(transaction),
      symbol: isAllowance ? AETERNITY_SYMBOL : getTxSymbol.value(transaction),
      isReceived: direction === TX_FUNCTIONS.received,
      isAe:
        isAllowance
        || (
          getTxSymbol.value(transaction) === AETERNITY_SYMBOL
          && !isTxAex9.value(transaction)
        ),
    }];
  });

  return {
    tokens,
  };
}
