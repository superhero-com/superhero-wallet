import { computed } from '@vue/composition-api';
import { camelCase } from 'lodash-es';
import type {
  ITransaction, ITokenList, ITx, TransactionType,
} from '../types';
import * as TransactionResolver from '../popup/utils/transactionTokenInfoResolvers';

import {
  AETERNITY_SYMBOL, convertToken, FUNCTION_TYPE_DEX, MAGNITUDE, RETURN_TYPE_OK,
} from '../popup/utils';
import { useGetter, useState } from './vuex';

interface ITokenTransactionComposable extends ITx {
  decimals?: number,
  amount: number,
  symbol: string,
  isReceived: string,
  isAe: string
}

export const useTransactionToken = (
  transaction: ITransaction,
  showDetailedAllowanceInfo?: boolean,
) => {
  const fungibleTokens = useState('fungibleTokens');
  const availableTokens = computed<ITokenList>(() => fungibleTokens.value.availableTokens);

  const getTxAmountTotal = useGetter('getTxAmountTotal');

  const getTxSymbol = useGetter('getTxSymbol');
  const getTxType = useGetter('getTxType');
  const getTxDirection = useGetter('getTxDirection');
  const getDexContracts = useGetter('getDexContracts');

  const txType = computed<TransactionType>(() => getTxType.value(transaction));

  const isAllowance = computed(() => FUNCTION_TYPE_DEX.allowance.includes(transaction?.tx?.function)
      && availableTokens.value[transaction?.tx?.contractId]);

  const transactionFunction = computed(() => {
    const functionName = camelCase(transaction?.tx?.function || '');

    // TODO this line needs refactoring in TransactionResolver
    // @ts-ignore
    return TransactionResolver[functionName as string];
  });

  const tokens = computed<ITokenTransactionComposable[]>(() => {
    if (!transaction
      && transactionFunction.value
      && (!isAllowance.value || showDetailedAllowanceInfo)
    ) {
      return transactionFunction.value(transaction, availableTokens.value).tokens;
    }

    return [{
      ...transaction?.tx || {},
      amount: isAllowance.value
        ? convertToken(transaction.tx.fee, -MAGNITUDE)
        : getTxAmountTotal.value(transaction),
      symbol: isAllowance.value ? AETERNITY_SYMBOL : getTxSymbol.value(transaction),
      isReceived: getTxDirection.value(transaction) === 'received',
      isAe: isAllowance.value || getTxSymbol.value(transaction) === AETERNITY_SYMBOL,
    }];
  });

  const isErrorTransaction = computed(
    () => {
      const returnType = transaction?.tx?.returnType;
      return returnType && returnType !== RETURN_TYPE_OK;
    },
  );

  const isDex = computed(() => transactionFunction.value
      && (getDexContracts.value.router.includes(transaction?.tx?.contractId)
        || getDexContracts.value.includes(transaction?.tx?.contractId)));

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
  };
};
