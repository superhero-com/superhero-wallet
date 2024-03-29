import { Web3Eth } from 'web3-eth';
import { fromWei } from 'web3-utils';
import BigNumber from 'bignumber.js';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';

import type { IFeeItem } from '@/types';
import { useEthNetworkSettings } from '@/protocols/ethereum/composables/ethNetworkSettings';
import { ETH_GAS_LIMIT } from '../config';

const MAX_PRIORITY_FEE_MULTIPLIERS = {
  slow: 1,
  medium: 1.5,
  fast: 2,
} as const;

export function useEthFeeCalculation() {
  const { ethActiveNetworkSettings } = useEthNetworkSettings();
  const { t } = useI18n();

  const feeSelectedIndex = ref(0);

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
        .multipliedBy(ETH_GAS_LIMIT),
      time: 300,
      label: t('common.transferSpeed.slow'),
      maxPriorityFee: maxPriorityFeePerGasSlow.value,
      maxFeePerGas: defaultMaxFeePerGas.value.plus(maxPriorityFeePerGasSlow.value),
    },
    {
      fee: defaultBaseFeePerGas.value
        .plus(maxPriorityFeePerGasMedium.value)
        .multipliedBy(ETH_GAS_LIMIT),
      time: 180,
      label: t('common.transferSpeed.medium'),
      maxPriorityFee: maxPriorityFeePerGasMedium.value,
      maxFeePerGas: defaultMaxFeePerGas.value.plus(maxPriorityFeePerGasMedium.value),
    },
    {
      fee: defaultBaseFeePerGas.value
        .plus(maxPriorityFeePerGasFast.value)
        .multipliedBy(ETH_GAS_LIMIT),
      time: 30,
      label: t('common.transferSpeed.fast'),
      maxPriorityFee: maxPriorityFeePerGasFast.value,
      maxFeePerGas: defaultMaxFeePerGas.value.plus(maxPriorityFeePerGasFast.value),
    },
  ]);

  const fee = computed(() => feeList.value[feeSelectedIndex.value].fee);
  const maxFeePerGas = computed(() => feeList.value[feeSelectedIndex.value].maxFeePerGas);
  const maxPriorityFeePerGas = computed(
    () => feeList.value[feeSelectedIndex.value].maxPriorityFee,
  );

  async function updateFeeList() {
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
    updateFeeList,
  };
}
