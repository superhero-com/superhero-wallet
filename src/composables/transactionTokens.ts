import { computed } from 'vue';
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
  AETERNITY_COIN_PRECISION,
  TX_DIRECTION,
  convertToken,
  isTransactionAex9,
  getInnerTransaction,
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
  const getTxSymbol = computed(() => store.getters.getTxSymbol);
  const getTxAmountTotal = computed(() => store.getters.getTxAmountTotal);
  const innerTx = computed(() => getInnerTransaction(transaction.tx));

  const availableTokens = computed<ITokenList>(
    () => (store.state as any).fungibleTokens.availableTokens,
  );

  const transactionFunction = computed(() => {
    if (innerTx.value?.function) {
      const functionName = camelCase(innerTx.value?.function) as TxFunctionParsed;

      // TODO this line needs refactoring in TransactionResolver
      return transactionTokenInfoResolvers[functionName];
    }
    return null;
  });

  const tokens = computed((): ITokenResolved[] => {
    if (
      innerTx.value
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
      ...innerTx.value || {},
      amount: isAllowance
        ? convertToken(innerTx.value?.fee || 0, -AETERNITY_COIN_PRECISION)
        : getTxAmountTotal.value(transaction, direction),
      symbol: isAllowance ? AETERNITY_SYMBOL : getTxSymbol.value(transaction),
      isReceived: direction === TX_DIRECTION.received,
      isAe:
        isAllowance
        || (
          getTxSymbol.value(transaction) === AETERNITY_SYMBOL
          && !isTransactionAex9(transaction)
        ),
    }];
  });

  return {
    tokens,
  };
}
