import { Web3Eth } from 'web3-eth';
import { fromWei } from 'web3-utils';
import BigNumber from 'bignumber.js';
import {
  computed,
  ComputedRef,
  Ref,
  ref,
} from 'vue';

import type { IFeeItem } from '@/types';
import { tg } from '@/popup/plugins/i18n';
import { useEthNetworkSettings } from '@/protocols/ethereum/composables/ethNetworkSettings';
import { ETH_GAS_LIMIT } from '../config';

const MAX_PRIORITY_FEE_MULTIPLIERS = {
  slow: 1,
  medium: 1.5,
  fast: 2,
} as const;

export function useEthFeeCalculation(recipientsCount: Ref<number> | ComputedRef<number> = ref(1)) {
  const { ethActiveNetworkSettings } = useEthNetworkSettings();

  const feeSelectedIndex = ref(0);
  const gasLimit = ref(ETH_GAS_LIMIT);

  // base fee per gas
  const defaultBaseFeePerGas = ref(new BigNumber(0));

  // max priority fee per gas (tip for miner)
  const defaultMaxPriorityFeePerGas = ref(new BigNumber(0));

  // maximum fee per gas that can be used
  const defaultMaxFeePerGas = ref(new BigNumber(0));

  const maxPriorityFeePerGasSlow = computed(() => (
    defaultMaxPriorityFeePerGas.value.multipliedBy(MAX_PRIORITY_FEE_MULTIPLIERS.slow)
  ));
  const maxPriorityFeePerGasMedium = computed(() => (
    defaultMaxPriorityFeePerGas.value.multipliedBy(MAX_PRIORITY_FEE_MULTIPLIERS.medium)
  ));
  const maxPriorityFeePerGasFast = computed(() => (
    defaultMaxPriorityFeePerGas.value.multipliedBy(MAX_PRIORITY_FEE_MULTIPLIERS.fast)
  ));

  // TODO - set correct time values
  const feeList = computed((): IFeeItem[] => [
    {
      fee: defaultBaseFeePerGas.value
        .plus(maxPriorityFeePerGasSlow.value)
        .multipliedBy(gasLimit.value),
      time: 300,
      label: tg('common.transferSpeed.slow'),
      maxPriorityFee: maxPriorityFeePerGasSlow.value,
      maxFeePerGas: defaultMaxFeePerGas.value.plus(maxPriorityFeePerGasSlow.value),
    },
    {
      fee: defaultBaseFeePerGas.value
        .plus(maxPriorityFeePerGasMedium.value)
        .multipliedBy(gasLimit.value),
      time: 180,
      label: tg('common.transferSpeed.medium'),
      maxPriorityFee: maxPriorityFeePerGasMedium.value,
      maxFeePerGas: defaultMaxFeePerGas.value.plus(maxPriorityFeePerGasMedium.value),
    },
    {
      fee: defaultBaseFeePerGas.value
        .plus(maxPriorityFeePerGasFast.value)
        .multipliedBy(gasLimit.value),
      time: 30,
      label: tg('common.transferSpeed.fast'),
      maxPriorityFee: maxPriorityFeePerGasFast.value,
      maxFeePerGas: defaultMaxFeePerGas.value.plus(maxPriorityFeePerGasFast.value),
    },
  ]);

  const fee = computed(() => (
    feeList.value[feeSelectedIndex.value].fee.multipliedBy(recipientsCount.value)
  ));
  const maxFeePerGas = computed(() => (
    feeList.value[feeSelectedIndex.value].maxFeePerGas!.multipliedBy(recipientsCount.value)
  ));
  const maxPriorityFeePerGas = computed(
    () => feeList.value[feeSelectedIndex.value].maxPriorityFee!.multipliedBy(recipientsCount.value),
  );
  const maxFee = computed(() => (
    maxFeePerGas.value!.multipliedBy(gasLimit.value).multipliedBy(recipientsCount.value)));

  async function updateFeeList(newGasLimit?: number) {
    gasLimit.value = newGasLimit ?? ETH_GAS_LIMIT;
    const { nodeUrl } = ethActiveNetworkSettings.value;
    const web3Eth = new Web3Eth(nodeUrl);
    const feeData = await web3Eth.calculateFeeData();

    defaultBaseFeePerGas.value = new BigNumber(fromWei(feeData.baseFeePerGas!, 'ether'));
    defaultMaxFeePerGas.value = new BigNumber(fromWei(feeData.maxFeePerGas!, 'ether'));
    defaultMaxPriorityFeePerGas.value = new BigNumber(fromWei(feeData.maxPriorityFeePerGas!, 'ether'));
  }

  return {
    fee,
    feeList,
    feeSelectedIndex,
    maxFeePerGas,
    maxPriorityFeePerGas,
    maxFee,
    updateFeeList,
  };
}
