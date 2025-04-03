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
}

/**
 * Composable that allows to use real max amount of selected token
 * considering the fee that needs to be paid.
 */
export function useCoinMaxAmount({ formModel, fee }: CoinMaxAmountOptions) {
  const { balance } = useBalances();

  const isCoin = computed(() => {
    if (!formModel.value.selectedAsset?.protocol) {
      return false;
    }
    const adapter = ProtocolAdapterFactory.getAdapter(formModel.value.selectedAsset?.protocol!);
    return formModel.value?.selectedAsset?.contractId === adapter.coinContractId;
  });
  const selectedTokenBalance = computed(
    () => new BigNumber(
      toShiftedBigNumber(
        formModel.value.selectedAsset?.amount!,
        -(formModel.value.selectedAsset?.decimals || -0),
      ) || 0,
    ),
  );

  const max = computed(() => {
    if (balance.value && isCoin.value) {
      const maxAmount = balance.value
        .minus(fee.value)
        .dividedBy(formModel.value.addresses?.length || 1)
        .decimalPlaces(formModel.value.selectedAsset?.decimals!);
      return (maxAmount.isPositive() ? maxAmount : 0).toString();
    }
    return selectedTokenBalance.value.toString();
  });

  return { max };
}
