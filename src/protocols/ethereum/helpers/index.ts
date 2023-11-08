import { fromWei, toWei } from 'web3-utils';
import BigNumber from 'bignumber.js';

/**
 * Convert Gwei to Ether
 */
export function etherFromGwei(gwei: number) {
  return new BigNumber(fromWei(toWei(gwei, 'gwei'), 'ether'));
}
