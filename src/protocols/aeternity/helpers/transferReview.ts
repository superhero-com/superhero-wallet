import BigNumber from 'bignumber.js';

export type NonceWarningType = 'replacement' | 'low';

export function getAdjustedTransferTotal(
  baseTotal?: number,
  estimatedFee?: BigNumber | number | string,
  selectedFee?: BigNumber | number | string,
) {
  if (baseTotal == null) {
    return undefined;
  }

  return new BigNumber(baseTotal)
    .minus(new BigNumber(estimatedFee || 0))
    .plus(new BigNumber(selectedFee || 0))
    .toNumber();
}

export function getNonceWarningMessageKey(
  parsedNonce?: number | null,
  currentAccountNonce?: number | null,
  hasPendingTransactionWithSameNonce = false,
): NonceWarningType | undefined {
  if (parsedNonce == null || parsedNonce < 1) {
    return undefined;
  }

  if (hasPendingTransactionWithSameNonce) {
    return 'replacement';
  }

  if (currentAccountNonce != null && parsedNonce < currentAccountNonce) {
    return 'low';
  }

  return undefined;
}
