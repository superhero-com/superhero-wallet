import fc from 'fast-check';

/**
 * A decimal string with at most `decimals` fraction digits and the exact base units it
 * stands for. Half the runs take the top half of the range and every fraction digit,
 * where lossy conversions show.
 */
export function amountWithBaseUnits(decimals: number, maxWhole: bigint) {
  return fc.oneof(
    fc.integer({ min: 0, max: decimals }),
    fc.constant(decimals),
  ).chain((fractionDigits) => fc.tuple(
    fc.oneof(
      fc.bigInt({ min: 0n, max: maxWhole }),
      fc.bigInt({ min: maxWhole / 2n, max: maxWhole }),
    ),
    fc.bigInt({ min: 0n, max: 10n ** BigInt(fractionDigits) - 1n }),
  ).map(([whole, fraction]) => ({
    amount: fractionDigits
      ? `${whole}.${fraction.toString().padStart(fractionDigits, '0')}`
      : whole.toString(),
    baseUnits: whole * 10n ** BigInt(decimals)
      + fraction * 10n ** BigInt(decimals - fractionDigits),
  })));
}
