import { Ref, computed } from 'vue';
import BigNumber from 'bignumber.js';

import type { BigNumberPublic } from '@/types';
import {
  MaxAmountOptions,
  useBalances,
} from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { toShiftedBigNumber } from '@/utils';

interface CoinMaxAmountOptions extends MaxAmountOptions {
  fee: Ref<BigNumberPublic>;
  /** The selected token's balance read from the node, used over the asset's one when set */
  tokenBalance?: Ref<BigNumberPublic | null>;
}

/**
 * Composable that allows to use real max amount of selected token
 * considering the fee that needs to be paid.
 */
export function useCoinMaxAmount({ formModel, fee, tokenBalance }: CoinMaxAmountOptions) {
  const { balance } = useBalances();

  const isCoin = computed(() => {
    if (!formModel.value.selectedAsset?.protocol) {
      return false;
    }
    const adapter = ProtocolAdapterFactory.getAdapter(formModel.value.selectedAsset?.protocol!);
    return formModel.value?.selectedAsset?.contractId === adapter.coinContractId;
  });

  // Token balances saved from Ethplorer can still have it as a string
  const assetDecimals = computed(() => {
    const decimals = Number(formModel.value.selectedAsset?.decimals ?? 0);
    return Number.isInteger(decimals) ? decimals : 0;
  });

  const selectedTokenBalance = computed((): BigNumberPublic => {
    if (tokenBalance?.value) {
      return tokenBalance.value;
    }

    const rawAmount = formModel.value.selectedAsset?.amount;

    if (rawAmount == null || rawAmount === '') {
      return new BigNumber(0);
    }

    const shifted = toShiftedBigNumber(rawAmount, -assetDecimals.value);
    return shifted.isNaN() ? new BigNumber(0) : shifted;
  });

  const max = computed(() => {
    if (balance.value && isCoin.value) {
      const maxAmount = balance.value
        .minus(fee.value)
        .dividedBy(formModel.value.addresses?.length || 1)
        .decimalPlaces(assetDecimals.value, BigNumber.ROUND_DOWN);
      return (maxAmount.isPositive() ? maxAmount : 0).toString();
    }
    return selectedTokenBalance.value
      .dividedBy(formModel.value.addresses?.length || 1)
      .decimalPlaces(assetDecimals.value, BigNumber.ROUND_DOWN)
      .toString();
  });

  return { max };
}
