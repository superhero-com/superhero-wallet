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

const MAX_PRIORITY_FEE_PER_GAS_SLOW = 0.1;
const MAX_PRIORITY_FEE_PER_GAS_MED = 0.15;
const MAX_PRIORITY_FEE_PER_GAS_FAST = 0.2;
const MAX_PRIORITY_FEE_PER_GAS_TESTNET = 0.000001;

export function useEthFeeCalculation() {
  const { ethActiveNetworkSettings } = useEthNetworkSettings();
  const { isActiveNetworkTestnet: isTestnet } = useNetworks();
  const { t } = useI18n();

  const feeSelectedIndex = ref(1);

  // total fee
  const feeSlow = ref(new BigNumber(0.00000002));
  const feeMedium = ref(new BigNumber(0.00000002));
  const feeHigh = ref(new BigNumber(0.00000002));

  // max priority fee per gas
  const maxPriorityFeePerGasSlow = ref(
    etherFromGwei(isTestnet ? MAX_PRIORITY_FEE_PER_GAS_TESTNET : MAX_PRIORITY_FEE_PER_GAS_SLOW),
  );
  const maxPriorityFeePerGasMedium = ref(
    etherFromGwei(isTestnet ? MAX_PRIORITY_FEE_PER_GAS_TESTNET : MAX_PRIORITY_FEE_PER_GAS_MED),
  );
  const maxPriorityFeePerGasFast = ref(
    etherFromGwei(isTestnet ? MAX_PRIORITY_FEE_PER_GAS_TESTNET : MAX_PRIORITY_FEE_PER_GAS_FAST),
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

    /**
     * maxFeePerGas is not included in the fee when calculating the max amount
     * thus if maxFeePerGas is too high, it can happen that max amount transactions
     * do not go through because of insufficient funds
     * In testnet we can use lower max fees.
     * maxFeePerGas = 2 * baseFee + maxPriorityFeePerGas is the recommended value
     * Lowering it in mainnet should be tested
     */
    maxFeePerGasSlow.value = baseFee
      .multipliedBy(isTestnet ? 1 : 2)
      .plus(maxPriorityFeePerGasSlow.value);
    maxFeePerGasMedium.value = baseFee
      .multipliedBy(isTestnet ? 1 : 2)
      .plus(maxPriorityFeePerGasMedium.value);
    maxFeePerGasHigh.value = baseFee
      .multipliedBy(isTestnet ? 1 : 2)
      .plus(maxPriorityFeePerGasFast.value);

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
