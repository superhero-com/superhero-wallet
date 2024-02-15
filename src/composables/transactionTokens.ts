import { computed } from 'vue';
import { camelCase } from 'lodash-es';
import type {
  ITokenResolved,
  ITransaction,
  TxFunctionParsed,
} from '@/types';
import { PROTOCOLS, TX_DIRECTION, ASSET_TYPES } from '@/constants';
import { toShiftedBigNumber, isCoin } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { AE_SYMBOL } from '@/protocols/aeternity/config';
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
  const { getTxAmountTotal, getTxAssetSymbol, getProtocolAvailableTokens } = useFungibleTokens();

  const tokens = computed((): ITokenResolved[] => {
    if (!transaction) {
      return [];
    }

    const { protocol = PROTOCOLS.aeternity } = transaction || {};
    const protocolTokens = getProtocolAvailableTokens(protocol);

    // AE DEX and wrapped AE (WAE)
    // TODO move this logic to adapter and store resolved data in the transactions
    if (
      innerTx.value?.function
      && (!isAllowance || showDetailedAllowanceInfo)
    ) {
      const functionName = camelCase(innerTx.value?.function) as TxFunctionParsed;
      const functionResolver = getTransactionTokenInfoResolver(functionName);

      if (functionResolver) {
        return functionResolver(transaction, protocolTokens).tokens
          .map(({ amount, decimals, ...otherToken }) => ({
            amount: +toShiftedBigNumber(amount!, -decimals!),
            ...otherToken,
          }));
      }
    }

    const isReceived = direction === TX_DIRECTION.received;
    const adapter = ProtocolAdapterFactory.getAdapter(protocol);
    const amount = (isAllowance)
      ? toShiftedBigNumber(innerTx.value?.fee || 0, -adapter.coinPrecision)
      : getTxAmountTotal(transaction, direction);

    const symbol = isAllowance ? AE_SYMBOL : getTxAssetSymbol(transaction);
    const token = protocolTokens[transaction.tx.contractId];
    const isAe = isAllowance || (symbol === AE_SYMBOL && !isTransactionAex9(transaction));
    const assetType = isCoin(transaction.tx?.contractId) || isAe
      ? ASSET_TYPES.coin
      : ASSET_TYPES.token;

    return [{
      ...innerTx.value || {},
      ...token || {},
      amount,
      isAe,
      assetType,
      protocol,
      isReceived,
      symbol,
    }];
  });

  return {
    tokens,
  };
}
