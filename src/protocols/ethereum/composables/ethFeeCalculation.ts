import { Web3Eth } from 'web3-eth';
import { fromWei } from 'web3-utils';
import BigNumber from 'bignumber.js';
import {
  computed,
  ComputedRef,
  Ref,
  ref,
} from 'vue';

import type { IFeeItem, Protocol } from '@/types';
import { tg } from '@/popup/plugins/i18n';
import { useEthNetworkSettings } from '@/protocols/ethereum/composables/ethNetworkSettings';
import { useBnbNetworkSettings } from '@/protocols/bnb/composables/bnbNetworkSettings';
import { useAvalancheNetworkSettings } from '@/protocols/avalanche/composables/avalancheNetworkSettings';
import { PROTOCOLS } from '@/constants';
import { ETH_GAS_LIMIT } from '../config';

const MAX_PRIORITY_FEE_MULTIPLIERS = {
  slow: 1,
  medium: 1.5,
  fast: 2,
} as const;

export function useEthFeeCalculation(
  protocol: Protocol,
  recipientsCount: Ref<number> | ComputedRef<number> = ref(1),
) {
  const { ethActiveNetworkSettings } = useEthNetworkSettings();
  const { bnbActiveNetworkSettings } = useBnbNetworkSettings();
  const { avalancheActiveNetworkSettings } = useAvalancheNetworkSettings();

  const feeSelectedIndex = ref(0);
  const gasLimit = ref(ETH_GAS_LIMIT);

  // defaults
  const defaultBaseFeePerGas = ref(new BigNumber(0));
  const defaultMaxPriorityFeePerGas = ref(new BigNumber(0));
  const defaultMaxFeePerGas = ref(new BigNumber(0));
  const defaultGasPrice = ref(new BigNumber(0)); // for BNB

  const maxPriorityFeePerGasSlow = computed(() => (
    defaultMaxPriorityFeePerGas.value.multipliedBy(MAX_PRIORITY_FEE_MULTIPLIERS.slow)
  ));
  const maxPriorityFeePerGasMedium = computed(() => (
    defaultMaxPriorityFeePerGas.value.multipliedBy(MAX_PRIORITY_FEE_MULTIPLIERS.medium)
  ));
  const maxPriorityFeePerGasFast = computed(() => (
    defaultMaxPriorityFeePerGas.value.multipliedBy(MAX_PRIORITY_FEE_MULTIPLIERS.fast)
  ));

  const feeList = computed((): IFeeItem[] => {
    if (protocol === PROTOCOLS.ethereum) {
      return [
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
      ];
    }

    // BNB Chain & Avalanche: simple gasPrice * multiplier
    return [
      {
        fee: defaultGasPrice.value
          .multipliedBy(MAX_PRIORITY_FEE_MULTIPLIERS.slow).multipliedBy(gasLimit.value),
        time: 16,
        label: tg('common.transferSpeed.slow'),
      },
      {
        fee: defaultGasPrice.value
          .multipliedBy(MAX_PRIORITY_FEE_MULTIPLIERS.medium).multipliedBy(gasLimit.value),
        time: 8,
        label: tg('common.transferSpeed.medium'),
      },
      {
        fee: defaultGasPrice.value
          .multipliedBy(MAX_PRIORITY_FEE_MULTIPLIERS.fast).multipliedBy(gasLimit.value),
        time: 3,
        label: tg('common.transferSpeed.fast'),
      },
    ];
  });

  const fee = computed(() => (
    feeList.value[feeSelectedIndex.value].fee.multipliedBy(recipientsCount.value)));

  async function updateFeeList(newGasLimit?: number) {
    gasLimit.value = newGasLimit ?? ETH_GAS_LIMIT;

    if (protocol === PROTOCOLS.ethereum) {
      const { nodeUrl } = ethActiveNetworkSettings.value;
      const web3Eth = new Web3Eth(nodeUrl);
      const feeData = await web3Eth.calculateFeeData();

      defaultBaseFeePerGas.value = new BigNumber(fromWei(feeData.baseFeePerGas!, 'ether'));
      defaultMaxFeePerGas.value = new BigNumber(fromWei(feeData.maxFeePerGas!, 'ether'));
      defaultMaxPriorityFeePerGas.value = new BigNumber(fromWei(feeData.maxPriorityFeePerGas!, 'ether'));
    } else if (protocol === PROTOCOLS.bnb || protocol === PROTOCOLS.avalanche) {
      const { nodeUrl } = protocol === PROTOCOLS.bnb
        ? bnbActiveNetworkSettings.value
        : avalancheActiveNetworkSettings.value;
      const web3Eth = new Web3Eth(nodeUrl);
      const gasPrice = await web3Eth.getGasPrice();
      defaultGasPrice.value = new BigNumber(fromWei(gasPrice, 'ether'));
    }
  }

  const maxFeePerGas = computed(() => (
    protocol === PROTOCOLS.ethereum
      ? feeList.value[feeSelectedIndex.value].maxFeePerGas!.multipliedBy(recipientsCount.value)
      : new BigNumber(0)
  ));

  const maxPriorityFeePerGas = computed(() => (
    protocol === PROTOCOLS.ethereum
      ? feeList.value[feeSelectedIndex.value].maxPriorityFee!.multipliedBy(recipientsCount.value)
      : new BigNumber(0)
  ));

  const maxFee = computed(() => (
    protocol === PROTOCOLS.ethereum
      ? maxFeePerGas.value!.multipliedBy(gasLimit.value).multipliedBy(recipientsCount.value)
      : fee.value // for BNB & Avalanche, maxFee is just fee
  ));

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
