import { ACCOUNT_CHECK_TIMEOUT } from '@/constants';
import { AccountDiscoveryError } from '@/lib/errors';
import { getLastNotEmptyAccountIndex } from '@/utils/common';

const derive = (_seed: Uint8Array, index: number) => ({ address: `address-${index}` } as any);
const seed = new Uint8Array(64);

describe('getLastNotEmptyAccountIndex', () => {
  it('returns the last used index once the gap limit of unused ones is reached', async () => {
    const used = new Set(['address-0', 'address-3']);

    await expect(getLastNotEmptyAccountIndex(async (address) => used.has(address), derive, seed))
      .resolves.toBe(3);
  });

  it('finds an account used after unused ones within the gap limit', async () => {
    const used = new Set(['address-0', 'address-1', 'address-6']);

    await expect(getLastNotEmptyAccountIndex(async (address) => used.has(address), derive, seed))
      .resolves.toBe(6);
  });

  it('returns -1 when no account is used', async () => {
    await expect(getLastNotEmptyAccountIndex(async () => false, derive, seed))
      .resolves.toBe(-1);
  });

  it.each([
    ['after finding accounts', 'address-6', ['address-0', 'address-1'], 1],
    ['next to accounts found in the same checks', 'address-2', ['address-0', 'address-1'], 1],
    ['before an account found in the same checks', 'address-1', ['address-0', 'address-3'], 3],
    ['in later checks, before an account found there', 'address-5', ['address-0', 'address-1', 'address-6'], 6],
    ['before finding any', 'address-0', [], -1],
    ['before accounts found in later checks', 'address-2', ['address-0', 'address-1', 'address-3', 'address-8'], 8],
  ])('fails with the last used index found when a check fails %s', async (_, failingAddress, usedAddresses, lastUsedIndex) => {
    const reason = new Error('network down');
    const isAccountUsed = async (address: string) => {
      if (address === failingAddress) throw reason;
      return usedAddresses.includes(address);
    };

    const error = await getLastNotEmptyAccountIndex(isAccountUsed, derive, seed)
      .catch((e) => e);
    expect(error).toBeInstanceOf(AccountDiscoveryError);
    expect(error).toMatchObject({ reason, lastUsedIndex });
  });

  describe('with a slow node', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    /** Answers for each index after `delay(index)` ms, never for `Infinity`. */
    function answerAfter(delay: (index: number) => number, usedIndexes: number[]) {
      return async (address: string) => {
        const index = Number(address.split('-')[1]);
        return new Promise<boolean>((resolve) => {
          if (delay(index) !== Infinity) {
            setTimeout(() => resolve(usedIndexes.includes(index)), delay(index));
          }
        });
      };
    }

    it('counts a check it gets no answer to in time as failed, and finds the accounts after it', async () => {
      const isAccountUsed = answerAfter((index) => (index === 2 ? Infinity : 0), [0, 1, 3, 6]);
      const discovery = getLastNotEmptyAccountIndex(isAccountUsed, derive, seed)
        .catch((e) => e);

      await vi.runAllTimersAsync();

      expect(await discovery).toBeInstanceOf(AccountDiscoveryError);
      expect(await discovery).toMatchObject({ lastUsedIndex: 6 });
    });

    it('never cuts a node that answers each check in time, however long the scan takes', async () => {
      const usedIndexes = Array.from({ length: 12 }, (_, index) => index);
      const isAccountUsed = answerAfter(() => ACCOUNT_CHECK_TIMEOUT - 1, usedIndexes);
      const discovery = getLastNotEmptyAccountIndex(isAccountUsed, derive, seed);

      await vi.runAllTimersAsync();

      await expect(discovery).resolves.toBe(11);
    });
  });
});
