import BigNumber from 'bignumber.js';
import { toWei } from 'web3-utils';
import type { BigNumberPublic } from '@/types';

/**
 * `estimateGas` can undershoot by mining time (e.g. first-time recipient storage
 * writes); an underestimate reverts out-of-gas with the fee spent, so add 15%.
 */
export function withGasHeadroom(estimatedGas: bigint | number): bigint {
  return (BigInt(estimatedGas) * BigInt(115)) / BigInt(100);
}

/** ERC-20 amounts scale by the token's own `decimals()`, not the chain's 1e18. */
export function toTokenBaseUnits(amount: BigNumberPublic, decimals: number): bigint {
  return BigInt(amount.shiftedBy(decimals).toFixed(0, BigNumber.ROUND_DOWN));
}

/**
 * Gas price in wei for a chain without EIP-1559: the one picked on the send form
 * (in the coin's unit), or the node's when there is none.
 */
export async function getLegacyGasPrice(
  web3Eth: { getGasPrice: () => Promise<bigint> },
  pickedGasPrice?: string,
): Promise<bigint> {
  return Number(pickedGasPrice) > 0
    ? BigInt(toWei(pickedGasPrice!, 'ether'))
    : web3Eth.getGasPrice();
}
