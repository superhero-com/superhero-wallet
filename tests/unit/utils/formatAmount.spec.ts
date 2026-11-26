import fc from 'fast-check';
import BigNumber from 'bignumber.js';

import { formatAmount, formatAmountParts } from '@/utils/formatters';
import { amountWithBaseUnits } from '../../fixtures/amountArbitraries';

const SHORT = { maxDecimals: 9, significantDigits: 6 };
const PRECISE = { maxDecimals: 9 };

const parse = (formatted: string) => new BigNumber(formatted.replace(/,/g, ''));

describe('formatAmount', () => {
  it.each([
    [4.99983082, '4.99983'],
    [0.999, '0.999'],
    [9.995, '9.995'],
    [1234.5678, '1,234.56'],
    [123456789.987, '123,456,789.98'],
    [0.00999999999, '0.00999999'],
    [0.0000123456789, '0.000012345'],
    [-4.99983082, '-4.99983'],
  ])('cuts %s down to 6 significant digits: %s', (value, expected) => {
    expect(formatAmount(value, SHORT)).toBe(expected);
  });

  it('shows every decimal up to the most decimals without significant digits', () => {
    expect(formatAmount(10.00018244, PRECISE)).toBe('10.00018244');
    expect(formatAmount(4.9999999999, PRECISE)).toBe('4.999999999');
  });

  it('drops float noise before cutting', () => {
    expect(formatAmount(0.3 - 0.1, PRECISE)).toBe('0.2');
    expect(formatAmount(1 - 0.9, SHORT)).toBe('0.1');
  });

  it('keeps the digits a float holds past 15 significant digits', () => {
    expect(formatAmount(1234567.123473649, PRECISE)).toBe('1,234,567.123473649');
    expect(formatAmount(12345678901234.56, SHORT)).toBe('12,345,678,901,234.56');
  });

  it('pads the decimals with zeros', () => {
    expect(formatAmount(5, { ...SHORT, minDecimals: 2 })).toBe('5.00');
    expect(formatAmount(4.99983082, { ...SHORT, minDecimals: 2 })).toBe('4.99983');
  });

  it('takes strings and BigNumbers', () => {
    expect(formatAmount('4.999830820000000001', SHORT)).toBe('4.99983');
    expect(formatAmount(new BigNumber('0.999999999999999999'), PRECISE)).toBe('0.999999999');
  });

  it('splits the cut amount into parts', () => {
    const parts = formatAmountParts(4.99983082, { ...SHORT, minDecimals: 2 });

    expect(parts.filter(({ type }) => type !== 'literal')).toEqual([
      { type: 'integer', value: '4' },
      { type: 'decimal', value: '.' },
      { type: 'fraction', value: '99983' },
    ]);
  });

  // Up to the 15 significant digits a float formats exactly
  describe('an 18 decimals amount', () => {
    const amounts = amountWithBaseUnits(18, 10n ** 12n).map(({ amount }) => amount);
    const smallAmounts = amountWithBaseUnits(18, 999999n).map(({ amount }) => amount);

    it('never shows more than it is', () => {
      fc.assert(fc.property(amounts, (amount) => {
        expect(parse(formatAmount(amount, SHORT)).lte(amount)).toBe(true);
      }));
      fc.assert(fc.property(smallAmounts, (amount) => {
        expect(parse(formatAmount(amount, PRECISE)).lte(amount)).toBe(true);
      }));
    });

    it('loses less than its 6th significant digit or its 9th decimal', () => {
      fc.assert(fc.property(amounts, (amount) => {
        const lost = new BigNumber(amount).minus(parse(formatAmount(amount, SHORT)));

        expect(lost.lt(BigNumber.max(new BigNumber(amount).times(1e-5), 1e-9))).toBe(true);
      }));
    });
  });

  describe('a float amount', () => {
    // Every digit of these survives the float
    const floatAmounts = fc.tuple(
      fc.bigInt({ min: 0n, max: 10n ** 15n - 1n }),
      fc.integer({ min: 0, max: 18 }),
    ).map(([units, scale]) => new BigNumber(units.toString()).shiftedBy(-scale).toFixed());
    // Below 2^23 a float keeps every 9th decimal
    const typedAmounts = amountWithBaseUnits(9, 2n ** 23n - 1n).map(({ amount }) => amount);

    it('never shows more than it is and loses less than its 6th significant digit', () => {
      fc.assert(fc.property(floatAmounts, (amount) => {
        const shown = parse(formatAmount(Number(amount), SHORT));

        expect(shown.lte(amount)).toBe(true);
        expect(new BigNumber(amount).minus(shown)
          .lt(BigNumber.max(new BigNumber(amount).times(1e-5), 1e-9))).toBe(true);
      }));
    });

    it('shows every digit of a typed amount in high precision', () => {
      fc.assert(fc.property(typedAmounts, (amount) => {
        expect(parse(formatAmount(Number(amount), PRECISE)).toFixed())
          .toBe(new BigNumber(amount).toFixed());
      }));
    });
  });
});
