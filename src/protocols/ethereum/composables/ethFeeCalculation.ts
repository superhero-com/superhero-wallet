import { Web3Eth } from 'web3-eth';
import { fromWei } from 'web3-utils';
import BigNumber from 'bignumber.js';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';

import type { IFeeItem } from '@/types';
import { useNetworks } from '@/composables';
import { useEthNetworkSettings } from '@/protocols/ethereum/composables/ethNetworkSettings';
import { ETH_GAS_LIMIT } from '../config';
import { etherFromGwei } from '../helpers';

export function useEthFeeCalculation() {
  const { ethActiveNetworkSettings } = useEthNetworkSettings();
  const { isActiveNetworkTestnet } = useNetworks();
  const { t } = useI18n();

  const feeSelectedIndex = ref(1);

  // total fee
  const feeSlow = ref(new BigNumber(0.00000002));
  const feeMedium = ref(new BigNumber(0.00000002));
  const feeHigh = ref(new BigNumber(0.00000002));

  // max priority fee per gas
  const maxPriorityFeePerGasSlow = ref(
    etherFromGwei(isActiveNetworkTestnet.value ? 0.000001 : 0.1),
  );
  const maxPriorityFeePerGasMedium = ref(
    etherFromGwei(isActiveNetworkTestnet.value ? 0.000001 : 0.15),
  );
  const maxPriorityFeePerGasFast = ref(
    etherFromGwei(isActiveNetworkTestnet.value ? 0.000001 : 0.2),
  );

  // maximum fee per gas that will be paid
  const maxFeePerGasSlow = ref(new BigNumber(0));
  const maxFeePerGasMedium = ref(new BigNumber(0));
  const maxFeePerGasHigh = ref(new BigNumber(0));

  // TODO - set correct time values
  const feeList = computed((): IFeeItem[] => [
    {
      fee: feeSlow.value,
      time: 300,
      label: t('common.transferSpeed.slow'),
      maxPriorityFee: maxPriorityFeePerGasSlow.value,
      maxFeePerGas: maxFeePerGasSlow.value,
    },
    {
      fee: feeMedium.value,
      time: 180,
      label: t('common.transferSpeed.medium'),
      maxPriorityFee: maxPriorityFeePerGasMedium.value,
      maxFeePerGas: maxFeePerGasMedium.value,
    },
    {
      fee: feeHigh.value,
      time: 30,
      label: t('common.transferSpeed.fast'),
      maxPriorityFee: maxPriorityFeePerGasFast.value,
      maxFeePerGas: maxFeePerGasHigh.value,
    },
  ]);

  const fee = computed(() => feeList.value[feeSelectedIndex.value].fee);
  const maxFeePerGas = computed(() => feeList.value[feeSelectedIndex.value].maxFeePerGas);
  const maxPriorityFeePerGas = computed(
    () => feeList.value[feeSelectedIndex.value].maxPriorityFee,
  );

  /**
   * Return the base fee of the latest block in Ether
   */
  async function fetchBaseFee() {
    const { nodeUrl } = ethActiveNetworkSettings.value;
    const web3Eth = new Web3Eth(nodeUrl);
    const latestBlock = await web3Eth.getBlock('latest', false);
    return fromWei(latestBlock.baseFeePerGas!, 'ether');
  }

  async function updateFeeList() {
    const baseFee = new BigNumber(await fetchBaseFee());

    maxFeePerGasSlow.value = baseFee.multipliedBy(2).plus(maxPriorityFeePerGasSlow.value);
    maxFeePerGasMedium.value = baseFee.multipliedBy(2).plus(maxPriorityFeePerGasMedium.value);
    maxFeePerGasHigh.value = baseFee.multipliedBy(2).plus(maxPriorityFeePerGasFast.value);

    feeSlow.value = baseFee.plus(maxPriorityFeePerGasSlow.value).multipliedBy(ETH_GAS_LIMIT);
    feeMedium.value = baseFee.plus(maxPriorityFeePerGasMedium.value).multipliedBy(ETH_GAS_LIMIT);
    feeHigh.value = baseFee.plus(maxPriorityFeePerGasFast.value).multipliedBy(ETH_GAS_LIMIT);
  }

  return {
    fee,
    feeList,
    feeSelectedIndex,
    maxFeePerGas,
    maxPriorityFeePerGas,
    fetchBaseFee,
    updateFeeList,
  };
}
