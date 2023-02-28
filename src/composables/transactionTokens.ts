import { computed } from '@vue/composition-api';
import { camelCase } from 'lodash-es';
import type {
  IDefaultComposableOptions,
  ITokenResolved,
  ITransaction,
  TxFunctionParsed,
  TxFunctionRaw,
} from '../types';
import {
  AETERNITY_SYMBOL,
  MAGNITUDE,
  TX_FUNCTIONS,
  convertToken,
  isTransactionAex9,
  getInnerTransaction,
} from '../popup/utils';
import { transactionTokenInfoResolvers } from '../popup/utils/transactionTokenInfoResolvers';
import { useFungibleTokens } from './fungibleTokens';

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
  const {
    availableTokens,
    getTxSymbol,
    getTxAmountTotal,
  } = useFungibleTokens({ store });
  const innerTx = computed(() => getInnerTransaction(transaction.tx));

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
        ? convertToken(innerTx.value?.fee || 0, -MAGNITUDE)
        : getTxAmountTotal(transaction, direction as TxFunctionRaw),
      symbol: isAllowance ? AETERNITY_SYMBOL : getTxSymbol(transaction),
      isReceived: direction === TX_FUNCTIONS.received,
      isAe:
        isAllowance
        || (
          getTxSymbol(transaction) === AETERNITY_SYMBOL
          && !isTransactionAex9(transaction)
        ),
    }];
  });

  return {
    tokens,
  };
}
