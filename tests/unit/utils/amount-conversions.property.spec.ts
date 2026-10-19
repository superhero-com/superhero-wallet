import fc from 'fast-check';
import BigNumber from 'bignumber.js';
import { toBitcoin, toSatoshi } from 'satoshi-bitcoin';

import { toShiftedBigNumber } from '@/utils/common';
import { aeToAettos, aettosToAe } from '@/protocols/aeternity/helpers';
import { toTokenBaseUnits } from '@/protocols/evm/helpers';
import { satoshiToBtc } from '@/protocols/bitcoin/helpers';
import { amountWithBaseUnits } from '../../fixtures/amountArbitraries';

const DECIMALS = [0, 6, 8, 9, 18];

// Far above any supply, so a lossy step (float, exponent notation) would show.
const LARGE = 10n ** 30n;

describe('amount <-> base unit conversions', () => {
  describe.each(DECIMALS)('toShiftedBigNumber at %i decimals', (decimals) => {
    it('turns an amount into its exact integer base units and back', () => {
      fc.assert(fc.property(amountWithBaseUnits(decimals, LARGE), ({ amount, baseUnits }) => {
        const shifted = toShiftedBigNumber(amount, decimals);

        expect(shifted.isInteger()).toBe(true);
        expect(shifted.toFixed()).toBe(baseUnits.toString());
        expect(toShiftedBigNumber(shifted.toFixed(), -decimals).isEqualTo(amount)).toBe(true);
      }));
    });

    it('turns base units into an amount and back', () => {
      fc.assert(fc.property(fc.bigInt({ min: 0n, max: LARGE ** 2n }), (baseUnits) => {
        const amount = toShiftedBigNumber(baseUnits.toString(), -decimals);

        expect(amount.decimalPlaces()).toBeLessThanOrEqual(decimals);
        expect(toShiftedBigNumber(amount.toFixed(), decimals).toFixed()).toBe(baseUnits.toString());
      }));
    });
  });

  describe.each(DECIMALS)('toTokenBaseUnits at %i decimals', (decimals) => {
    it('gives the exact base units as a bigint', () => {
      fc.assert(fc.property(amountWithBaseUnits(decimals, LARGE), ({ amount, baseUnits }) => {
        expect(toTokenBaseUnits(new BigNumber(amount), decimals)).toBe(baseUnits);
      }));
    });
  });

  describe('aeToAettos / aettosToAe (18 decimals)', () => {
    it('turns AE into the exact aettos and back', () => {
      fc.assert(fc.property(amountWithBaseUnits(18, LARGE), ({ amount, baseUnits }) => {
        const aettos = aeToAettos(amount);

        expect(aettos).toBe(baseUnits.toString());
        expect(new BigNumber(aettosToAe(aettos)).isEqualTo(amount)).toBe(true);
        // Callers also pass BigNumbers, whose toString switches to exponent notation.
        expect(aeToAettos(new BigNumber(amount))).toBe(baseUnits.toString());
      }));
    });

    it('turns aettos into AE and back', () => {
      fc.assert(fc.property(fc.bigInt({ min: 0n, max: LARGE ** 2n }), (aettos) => {
        expect(aeToAettos(aettosToAe(aettos.toString()))).toBe(aettos.toString());
        expect(aeToAettos(aettosToAe(new BigNumber(aettos.toString())))).toBe(aettos.toString());
      }));
    });
  });

  describe('Bitcoin (8 decimals, amounts as numbers)', () => {
    const MAX_BTC = 21_000_000n;

    it('converts any amount up to the supply to the exact satoshis and back', () => {
      fc.assert(fc.property(amountWithBaseUnits(8, MAX_BTC), ({ amount, baseUnits }) => {
        const satoshis = toSatoshi(Number(amount));

        expect(Number.isInteger(satoshis)).toBe(true);
        expect(BigInt(satoshis)).toBe(baseUnits);
        expect(toBitcoin(satoshis)).toBe(Number(amount));
        expect(satoshiToBtc(satoshis)).toBe(Number(amount));
      }));
    });
  });
});
