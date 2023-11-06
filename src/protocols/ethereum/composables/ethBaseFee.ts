import { Web3Eth } from 'web3-eth';
import { fromWei } from 'web3-utils';
import { useEthNetworkSettings } from '@/protocols/ethereum/composables/ethNetworkSettings';

export function useEthBaseFee() {
  const { ethActiveNetworkSettings } = useEthNetworkSettings();

  /**
   * Return the base fee of the latest block in Ether
   */
  async function getBaseFee() {
    const { nodeUrl } = ethActiveNetworkSettings.value;
    const web3Eth = new Web3Eth(nodeUrl);
    const latestBlock = await web3Eth.getBlock('latest', false);
    return fromWei(latestBlock.baseFeePerGas!, 'ether');
  }

  return {
    getBaseFee,
  };
}
