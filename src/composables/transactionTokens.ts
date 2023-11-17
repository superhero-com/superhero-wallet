import { computed } from 'vue';
import { camelCase } from 'lodash-es';
import type {
  ITokenResolved,
  ITransaction,
  TxFunctionParsed,
} from '@/types';
import { PROTOCOLS, TX_DIRECTION } from '@/constants';
import { toShiftedBigNumber } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import {
  AE_COIN_PRECISION,
  AE_SYMBOL,
} from '@/protocols/aeternity/config';
import {
  getInnerTransaction,
  getTransactionTokenInfoResolver,
  isTransactionAex9,
} from '@/protocols/aeternity/helpers';
import { useFungibleTokens } from './fungibleTokens';

interface UseTransactionTokensOptions {
  transaction: ITransaction;
  direction: string;
  isAllowance: boolean;
  showDetailedAllowanceInfo?: boolean;
}

export function useTransactionTokens({
  direction,
  isAllowance,
  transaction,
  showDetailedAllowanceInfo = false,
}: UseTransactionTokensOptions) {
  const innerTx = computed(() => getInnerTransaction(transaction.tx));
  const { availableTokens, getTxAmountTotal, getTxSymbol } = useFungibleTokens();

  const transactionFunction = computed(() => {
    if (innerTx.value?.function) {
      const functionName = camelCase(innerTx.value?.function) as TxFunctionParsed;

      // TODO this line needs refactoring in TransactionResolver
      return getTransactionTokenInfoResolver(functionName);
    }
    return null;
  });

  const tokens = computed((): ITokenResolved[] => {
    if (!transaction) {
      return [];
    }
    if (
      innerTx.value
      && transactionFunction.value
      && (!isAllowance || showDetailedAllowanceInfo)
    ) {
      return transactionFunction.value(
        transaction,
        availableTokens.value,
      ).tokens.map(({ amount, decimals, ...otherToken }) => ({
        amount: +toShiftedBigNumber(amount!, -decimals!),
        ...otherToken,
      }));
    }

    const isReceived = direction === TX_DIRECTION.received;
    const adapter = ProtocolAdapterFactory
      .getAdapter(transaction.protocol ?? PROTOCOLS.aeternity);

    if (transaction.protocol && transaction.protocol !== PROTOCOLS.aeternity) {
      return [{
        ...innerTx.value || {},
        symbol: adapter.protocolSymbol,
        amount: getTxAmountTotal(transaction, direction),
        isReceived,
      }];
    }

    return [{
      ...innerTx.value || {},
      amount: isAllowance
        ? toShiftedBigNumber(innerTx.value?.fee || 0, -AE_COIN_PRECISION)
        : getTxAmountTotal(transaction, direction),
      symbol: isAllowance ? AE_SYMBOL : getTxSymbol(transaction),
      isReceived,
      isAe:
        isAllowance
        || (
          getTxSymbol(transaction) === AE_SYMBOL
          && !isTransactionAex9(transaction)
        ),
    }];
  });

  return {
    tokens,
  };
}
