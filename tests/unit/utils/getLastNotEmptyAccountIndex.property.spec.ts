import fc from 'fast-check';

import { ADDRESS_GAP_LIMIT } from '@/constants';
import { AccountDiscoveryError } from '@/lib/errors';
import { getLastNotEmptyAccountIndex } from '@/utils/common';

const seed = new Uint8Array(64);
const derive = (_seed: Uint8Array, index: number) => ({ address: `address-${index}` } as any);
const indexOf = (address: string) => Number(address.split('-')[1]);

/** Used indexes that never leave `ADDRESS_GAP_LIMIT` unused ones in a row (counting from -1). */
const usedIndexesWithinGapLimit = fc
  .array(fc.integer({ min: 1, max: ADDRESS_GAP_LIMIT }), { maxLength: 40 })
  .map((steps) => steps.reduce<number[]>(
    (used, step) => [...used, (used.at(-1) ?? -1) + step],
    [],
  ));

describe('getLastNotEmptyAccountIndex (property)', () => {
  it('finds the highest used index and checks each index up to the gap limit after it once', async () => {
    await fc.assert(fc.asyncProperty(usedIndexesWithinGapLimit, async (used) => {
      const checked: number[] = [];
      const lastUsed = used.at(-1) ?? -1;

      const result = await getLastNotEmptyAccountIndex(async (address) => {
        checked.push(indexOf(address));
        return used.includes(indexOf(address));
      }, derive, seed);

      expect(result).toBe(lastUsed);
      expect(checked.sort((a, b) => a - b))
        .toEqual(Array.from({ length: lastUsed + ADDRESS_GAP_LIMIT + 1 }, (_, i) => i));
    }));
  });

  it('stops at a run of unused indexes as long as the gap limit', async () => {
    await fc.assert(fc.asyncProperty(
      usedIndexesWithinGapLimit,
      fc.integer({ min: ADDRESS_GAP_LIMIT + 1, max: 3 * ADDRESS_GAP_LIMIT }),
      async (used, step) => {
        const lastUsed = used.at(-1) ?? -1;
        const beyondGap = lastUsed + step;

        await expect(getLastNotEmptyAccountIndex(
          async (address) => [...used, beyondGap].includes(indexOf(address)),
          derive,
          seed,
        )).resolves.toBe(lastUsed);
      },
    ));
  });

  it('rejects when any check it makes fails, keeping at least the used indexes before it', async () => {
    await fc.assert(fc.asyncProperty(
      usedIndexesWithinGapLimit.chain((used) => fc.tuple(
        fc.constant(used),
        fc.integer({ min: 0, max: (used.at(-1) ?? -1) + ADDRESS_GAP_LIMIT }),
      )),
      async ([used, failingIndex]) => {
        const reason = new Error(`check of ${failingIndex} failed`);

        const error = await getLastNotEmptyAccountIndex(async (address) => {
          if (indexOf(address) === failingIndex) throw reason;
          return used.includes(indexOf(address));
        }, derive, seed).catch((e) => e);

        expect(error).toBeInstanceOf(AccountDiscoveryError);
        expect(error.reason).toBe(reason);
        const usedBefore = used.filter((index) => index < failingIndex);
        expect(error.lastUsedIndex).toBeGreaterThanOrEqual(usedBefore.at(-1) ?? -1);
        expect(error.lastUsedIndex === -1 || used.includes(error.lastUsedIndex)).toBe(true);
      },
    ));
  });
});
