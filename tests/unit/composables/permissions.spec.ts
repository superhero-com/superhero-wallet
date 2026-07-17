// @ts-nocheck
/**
 * [BLACK-BOX] tests for `checkTransactionSignLimit` in `src/composables/permissions.ts`.
 *
 * `checkTransactionSignLimit` is the accounting behind "auto-sign under a daily spend
 * limit": while a dApp's cumulative aettos spend for a rolling 24h window stays under
 * the user-configured `transactionSignLimit`, transactions are signed WITHOUT a
 * confirmation modal. A bug here means funds move without the user ever seeing a
 * prompt, so expectations below are derived from what any reasonable wallet user
 * would expect a "daily spend limit" to guarantee:
 *   - the limit is a hard ceiling on cumulative spend, not a per-transaction cap;
 *   - amount + network fee + AENS name fee must ALL count against the limit (a dApp
 *     can't sneak spend through the fee/nameFee fields);
 *   - a request that would push cumulative spend over the limit must be refused (the
 *     caller falls back to showing a confirmation modal) and must NOT be silently
 *     partially counted;
 *   - the window is rolling 24h from the first request, not a calendar day, and once
 *     it elapses the accumulator resets to zero;
 *   - no limit configured (0, or no permission at all) must NEVER auto-sign, since
 *     that's the documented safe default ("always ask for permission if limit is not
 *     set");
 *   - the aettos-to-AE unit conversion must be applied exactly once to the summed
 *     amount, not once per field (which would still be mathematically fine here since
 *     aettosToAe is linear, but a regression converting the pieces AND the sum would
 *     silently 2x the limit's effective headroom).
 *
 * Only `@/composables/modals` and `@/composables/accounts` are mocked (per repo
 * convention: mock the specific submodule, never the `@/composables` barrel) and only
 * for the `checkOrAskPermission` protocol-gate case, which needs to observe whether a
 * modal was shown. `checkTransactionSignLimit` itself is exercised directly against
 * the real `usePermissions()` singleton and real storage.
 */
import { METHODS } from '@aeternity/aepp-sdk';

const HOST = 'dapp.example';
const AETTO = 1; // smallest aettos unit
const ONE_AE_IN_AETTOS = 1e18;

/** Builds a full `IPermission` so `addPermission` doesn't leave required fields undefined. */
function buildPermission(overrides = {}) {
  return {
    host: HOST,
    address: true,
    addressList: true,
    messageSign: true,
    name: 'Example Dapp',
    dailySpendLimit: true,
    transactionSignFirstAskedOn: new Date().toISOString(),
    transactionSignLimit: 0,
    transactionSignSpent: 0,
    ...overrides,
  };
}

describe('usePermissions - checkTransactionSignLimit (black-box)', () => {
  let usePermissions;

  beforeEach(async () => {
    vi.resetModules();
    ({ usePermissions } = await import('@/composables/permissions'));
    usePermissions().resetPermissions();
  });

  describe('cumulative accumulation across sequential requests', () => {
    it('sums amount + fee + nameFee across sequential requests against the same limit', () => {
      const { addPermission, checkTransactionSignLimit } = usePermissions();
      // 5 AE/day limit.
      addPermission(buildPermission({ transactionSignLimit: 5 }));

      // 2 AE via `amount` alone.
      expect(checkTransactionSignLimit(HOST, { amount: 2 * ONE_AE_IN_AETTOS })).toBe(true);
      // 2 AE split across amount + fee + nameFee - all three must count.
      expect(checkTransactionSignLimit(HOST, {
        amount: 1 * ONE_AE_IN_AETTOS,
        fee: 0.5 * ONE_AE_IN_AETTOS,
        nameFee: 0.5 * ONE_AE_IN_AETTOS,
      })).toBe(true);
      // Running total is now 4 AE; one more 2 AE request crosses the 5 AE limit and
      // must be refused (falls back to the confirmation modal upstream).
      expect(checkTransactionSignLimit(HOST, { amount: 2 * ONE_AE_IN_AETTOS })).toBe(false);
    });

    it('does not count a refused (over-limit) request towards the running total', () => {
      const { addPermission, checkTransactionSignLimit, permissions } = usePermissions();
      addPermission(buildPermission({ transactionSignLimit: 5 }));

      expect(checkTransactionSignLimit(HOST, { amount: 4 * ONE_AE_IN_AETTOS })).toBe(true);
      // Refused: 4 + 2 = 6 > 5.
      expect(checkTransactionSignLimit(HOST, { amount: 2 * ONE_AE_IN_AETTOS })).toBe(false);
      // Spend must still read 4 AE, not 6 - a rejected tx must never inflate the
      // accumulator (that would permanently lock the user out of their own limit).
      expect(permissions.value[HOST].transactionSignSpent).toBe(4);

      // A request that fits in the remaining 1 AE of headroom must still succeed.
      expect(checkTransactionSignLimit(HOST, { amount: 1 * ONE_AE_IN_AETTOS })).toBe(true);
      expect(permissions.value[HOST].transactionSignSpent).toBe(5);
    });

    it('treats cumulative spend exactly equal to the limit as still within budget', () => {
      const { addPermission, checkTransactionSignLimit } = usePermissions();
      addPermission(buildPermission({ transactionSignLimit: 3 }));

      expect(checkTransactionSignLimit(HOST, { amount: 3 * ONE_AE_IN_AETTOS })).toBe(true);
    });

    // See "Potential bugs found" report: BUG-1. `transactionSignSpent`/`transactionSignLimit`
    // accounting uses plain JS `number` (IEEE-754 double), not BigNumber/BigInt. At the
    // exact boundary, `3 + 1e-18 === 3` in JS floating point, so the smallest possible
    // aeternity unit (1 aetto) of spend beyond an exactly-exhausted limit is silently
    // swallowed by rounding and auto-signed without a confirmation modal - the ceiling is
    // not actually hard at the smallest-unit boundary the plan mandates testing.
    it.fails('refuses the smallest unit (1 aetto) of spend beyond an exactly-exhausted limit', () => {
      const { addPermission, checkTransactionSignLimit } = usePermissions();
      addPermission(buildPermission({ transactionSignLimit: 3 }));

      expect(checkTransactionSignLimit(HOST, { amount: 3 * ONE_AE_IN_AETTOS })).toBe(true);
      expect(checkTransactionSignLimit(HOST, { amount: AETTO })).toBe(false);
    });
  });

  describe('24h window reset', () => {
    it('resets the accumulator once 24h have passed since the first request in the window', () => {
      const { addPermission, checkTransactionSignLimit, permissions } = usePermissions();
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      addPermission(buildPermission({
        transactionSignLimit: 5,
        transactionSignSpent: 5, // already fully spent in the "previous" window
        transactionSignFirstAskedOn: twentyFiveHoursAgo,
      }));

      // Would be refused if the old spend still applied (5 + 1 > 5); must succeed
      // because the window has rolled over and the accumulator resets to 0 first.
      expect(checkTransactionSignLimit(HOST, { amount: 1 * ONE_AE_IN_AETTOS })).toBe(true);
      expect(permissions.value[HOST].transactionSignSpent).toBe(1);
    });

    it('does NOT reset the accumulator when under 24h have passed', () => {
      const { addPermission, checkTransactionSignLimit } = usePermissions();
      const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
      addPermission(buildPermission({
        transactionSignLimit: 5,
        transactionSignSpent: 5,
        transactionSignFirstAskedOn: twentyThreeHoursAgo,
      }));

      expect(checkTransactionSignLimit(HOST, { amount: 1 * ONE_AE_IN_AETTOS })).toBe(false);
    });

    it('starts a fresh window (spend 0) on the very first request for a host', () => {
      const { addPermission, checkTransactionSignLimit, permissions } = usePermissions();
      // No prior `transactionSignFirstAskedOn` at all.
      addPermission(buildPermission({
        transactionSignLimit: 2,
        transactionSignFirstAskedOn: null,
      }));

      expect(checkTransactionSignLimit(HOST, { amount: 1 * ONE_AE_IN_AETTOS })).toBe(true);
      expect(permissions.value[HOST].transactionSignSpent).toBe(1);
    });
  });

  describe('limit of 0 / unset never auto-signs', () => {
    it('refuses when transactionSignLimit is 0', () => {
      const { addPermission, checkTransactionSignLimit } = usePermissions();
      addPermission(buildPermission({ transactionSignLimit: 0 }));

      expect(checkTransactionSignLimit(HOST, { amount: AETTO })).toBe(false);
    });

    it('refuses when transactionSignLimit is unset (no permission recorded for host)', () => {
      const { checkTransactionSignLimit } = usePermissions();

      expect(checkTransactionSignLimit(HOST, { amount: AETTO })).toBe(false);
    });

    it('refuses a zero-cost request when the limit is 0/unset (never auto-signs, even for free)', () => {
      const { addPermission, checkTransactionSignLimit } = usePermissions();
      addPermission(buildPermission({ transactionSignLimit: 0 }));

      expect(checkTransactionSignLimit(HOST, {})).toBe(false);
    });
  });

  describe('aettos -> AE conversion applied exactly once', () => {
    it('converts the SUM of amount+fee+nameFee once, not each field independently then again', () => {
      const { addPermission, checkTransactionSignLimit, permissions } = usePermissions();
      // A double-conversion bug (e.g. converting each field to AE, then re-running the
      // whole total through aettosToAe again) would divide the effective spend by another
      // 1e18 and this large a transaction would incorrectly sail under the limit.
      addPermission(buildPermission({ transactionSignLimit: 5 }));

      expect(checkTransactionSignLimit(HOST, {
        amount: 2 * ONE_AE_IN_AETTOS,
        fee: 2 * ONE_AE_IN_AETTOS,
        nameFee: 2 * ONE_AE_IN_AETTOS,
      })).toBe(false); // 6 AE > 5 AE limit
      // Nothing should have been recorded as spent since the request was refused.
      expect(permissions.value[HOST]?.transactionSignSpent ?? 0).toBe(0);
    });

    it('records spend in whole AE units, not raw aettos', () => {
      const { addPermission, checkTransactionSignLimit, permissions } = usePermissions();
      addPermission(buildPermission({ transactionSignLimit: 5 }));

      expect(checkTransactionSignLimit(HOST, { amount: 1 * ONE_AE_IN_AETTOS })).toBe(true);
      // If conversion were skipped, `transactionSignSpent` would read 1e18, not 1.
      expect(permissions.value[HOST].transactionSignSpent).toBe(1);
    });
  });

  describe('non-aeternity protocol never hits the silent auto-sign fast path', () => {
    /**
     * `checkTransactionSignLimit` itself has no notion of "protocol" - it only does
     * aettos accounting. The actual guarantee that non-aeternity signing requests
     * never skip the confirmation modal lives one level up, in `checkOrAskPermission`
     * (`modalProps.protocol !== PROTOCOLS.aeternity` short-circuits the fast path even
     * when `checkTransactionSignLimit`/`checkPermission` would have said "yes, within
     * budget"). Exercising that guarantee means going through `checkOrAskPermission`,
     * so `@/composables/modals` and `@/composables/accounts` are mocked here (specific
     * submodules, not the barrel) purely to observe whether a modal was shown.
     */
    const openModalMock = vi.fn();

    beforeEach(() => {
      openModalMock.mockReset();
      openModalMock.mockResolvedValue({});

      vi.doMock('@/composables/modals', () => ({
        useModals: () => ({ openModal: openModalMock }),
      }));
      vi.doMock('@/composables/accounts', async (importOriginal) => ({
        ...(await importOriginal()),
        useAccounts: () => ({ activeAccount: { value: { address: 'ak_2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' } } }),
      }));
    });

    async function askToSign(protocol) {
      vi.resetModules();
      const { usePermissions: useFreshPermissions } = await import('@/composables/permissions');
      const permissions = useFreshPermissions();
      permissions.resetPermissions();
      permissions.addPermission(buildPermission({ transactionSignLimit: 100 }));

      return permissions.checkOrAskPermission(
        METHODS.sign,
        `https://${HOST}/`,
        { tx: { amount: 1 * ONE_AE_IN_AETTOS }, protocol },
      );
    }

    it('auto-signs silently (no modal) for aeternity when within the daily limit', async () => {
      const { PROTOCOLS } = await import('@/constants');
      await askToSign(PROTOCOLS.aeternity);

      expect(openModalMock).not.toHaveBeenCalled();
    });

    it('always shows the confirmation modal for a non-aeternity protocol, even within the daily limit', async () => {
      const { PROTOCOLS } = await import('@/constants');
      await askToSign(PROTOCOLS.ethereum);

      expect(openModalMock).toHaveBeenCalled();
    });
  });
});
