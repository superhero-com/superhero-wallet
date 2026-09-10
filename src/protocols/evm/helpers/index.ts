import BigNumber from 'bignumber.js';

/**
 * `estimateGas` can undershoot by mining time (e.g. first-time recipient storage
 * writes); an underestimate reverts out-of-gas with the fee spent, so add 15%.
 */
export function withGasHeadroom(estimatedGas: bigint | number): bigint {
  return (BigInt(estimatedGas) * BigInt(115)) / BigInt(100);
}

/** ERC-20 amounts scale by the token's own `decimals()`, not the chain's 1e18. */
export function toTokenBaseUnits(amount: BigNumber, decimals: number): bigint {
  return BigInt(amount.shiftedBy(decimals).toFixed(0, BigNumber.ROUND_DOWN));
}
