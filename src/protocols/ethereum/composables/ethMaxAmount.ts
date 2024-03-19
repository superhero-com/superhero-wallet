import { Ref, computed } from 'vue';
import BigNumber from 'bignumber.js';

import type { BigNumberPublic } from '@/types';
import {
  MaxAmountOptions,
  useBalances,
} from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { PROTOCOLS } from '@/constants';
import { toShiftedBigNumber } from '@/utils';

interface EthMaxAmountOptions extends MaxAmountOptions {
  fee: Ref<BigNumberPublic>;
}

/**
 * Composable that allows to use real max amount of selected token
 * considering the fee that needs to be paid.
 */
export function useEthMaxAmount({ formModel, fee }: EthMaxAmountOptions) {
  const { balance } = useBalances();

  const isEthCoin = computed(() => {
    const ethAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.ethereum);
    return formModel.value?.selectedAsset?.contractId === ethAdapter.coinContractId;
  });
  const selectedTokenBalance = computed(
    () => new BigNumber(
      +toShiftedBigNumber(
        formModel.value.selectedAsset?.amount!,
        -formModel.value.selectedAsset?.decimals!,
      ) || 0,
    ),
  );

  const max = computed(() => {
    if (balance.value && isEthCoin.value) {
      const maxAmount = balance.value.minus(fee.value);
      return (maxAmount.isPositive() ? maxAmount : 0).toString();
    }
    return selectedTokenBalance.value.toString();
  });

  return { max };
}
