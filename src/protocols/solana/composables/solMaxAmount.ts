import {
  Ref, computed, watch, onMounted,
} from 'vue';
import BigNumber from 'bignumber.js';
import type { IFormModel } from '@/types';
import { useBalances } from '@/composables/balances';
import { toShiftedBigNumber } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { PROTOCOLS } from '@/constants';
import { debounce } from 'lodash-es';
import { useSolFeeCalculation } from './solFeeCalculation';

export function useSolMaxAmount(formModel: Ref<IFormModel>) {
  const { balance } = useBalances();
  const recipientsCount = computed(() => formModel.value?.addresses?.length || 1);
  const { fee, updateFeeList } = useSolFeeCalculation(recipientsCount);

  const total = computed(() => new BigNumber(formModel.value?.amount || 0).plus(fee.value || 0));

  const max = computed(() => {
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.solana);
    const isSol = formModel.value?.selectedAsset?.contractId === adapter.coinContractId;
    if (isSol && balance.value) {
      const available = new BigNumber(balance.value).minus(fee.value || 0);
      const perRecipient = available.div(recipientsCount.value);
      const decimals = formModel.value?.selectedAsset?.decimals || adapter.coinPrecision;
      return (
        perRecipient.isPositive()
          ? perRecipient
          : new BigNumber(0)
      ).decimalPlaces(decimals).toString();
    }
    // Token: return available token balance (shifted by decimals)
    const sel = formModel.value?.selectedAsset;
    if (sel?.amount != null) {
      const tokenBalance = new BigNumber(
        toShiftedBigNumber(sel.amount as any, -(sel.decimals || 0)) || 0,
      );
      return tokenBalance.toString();
    }
    return '0';
  });

  const debouncedUpdateFee = debounce(() => updateFeeList(), 500);

  onMounted(() => { updateFeeList(); });

  watch(
    () => [formModel.value?.selectedAsset, formModel.value?.addresses, formModel.value?.amount],
    () => debouncedUpdateFee(),
    { deep: true },
  );

  return {
    max,
    fee,
    total,
  };
}
