import { isAddress } from 'web3-validator';
import { fromWei, toWei } from 'web3-utils';
import BigNumber from 'bignumber.js';

export function isEthAddressValid(address: string) {
  return isAddress(address);
}

/**
 * Convert Gwei to Ether
 */
export function etherFromGwei(gwei: number) {
  return new BigNumber(fromWei(toWei(gwei, 'gwei'), 'ether'));
}
