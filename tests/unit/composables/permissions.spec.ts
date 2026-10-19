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
import {
  AccountMemory,
  Encoding,
  METHODS,
  Tag,
  buildTx as buildRawTx,
  encode,
  unpackTx,
} from '@aeternity/aepp-sdk';

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
    localStorage.clear();
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

    // The accumulation and the limit comparison both happen in BigNumber, not plain JS
    // `number` (IEEE-754 double), so the ceiling is hard even at the smallest possible
    // aeternity unit (1 aetto) beyond an exactly-exhausted limit.
    it('refuses the smallest unit (1 aetto) of spend beyond an exactly-exhausted limit', () => {
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

  describe('signing an aepp transaction under the daily limit', () => {
    /**
     * Through `checkOrAskPermission` with the props `AeAccountHdWallet.signTransaction`
     * passes, so `@/composables/modals` and `@/composables/accounts` are mocked
     * (specific submodules, not the barrel) to observe whether a modal was shown.
     */
    const openModalMock = vi.fn();
    const SENDER = AccountMemory.generate().address;
    const RECIPIENT = AccountMemory.generate().address;

    beforeEach(() => {
      openModalMock.mockReset();
      openModalMock.mockResolvedValue({});

      vi.doMock('@/composables/modals', () => ({
        useModals: () => ({ openModal: openModalMock }),
      }));
      vi.doMock('@/composables/accounts', async (importOriginal) => ({
        ...(await importOriginal()),
        useAccounts: () => ({ activeAccount: { value: { address: SENDER } } }),
      }));
    });

    afterEach(() => {
      vi.doUnmock('@/composables/modals');
      vi.doUnmock('@/composables/accounts');
    });

    function buildTx(tag) {
      const fields = {
        [Tag.SpendTx]: { senderId: SENDER, recipientId: RECIPIENT, amount: 2 * ONE_AE_IN_AETTOS },
        [Tag.ContractCallTx]: {
          callerId: SENDER,
          contractId: encode(new Uint8Array(32), Encoding.ContractAddress),
          amount: 2 * ONE_AE_IN_AETTOS,
          gasLimit: 1e5,
          gasPrice: 1e9,
          callData: 'cb_KxFE1kQfP4oEp9E=',
        },
        [Tag.NameClaimTx]: {
          accountId: SENDER,
          name: 'superherowallettest.chain',
          nameSalt: 1,
          // The minimum for the name: 0.0987 AE
          nameFee: '98700000000000000',
        },
      }[tag];
      return buildRawTx({
        tag, fee: 2e14, nonce: 1, ...fields,
      });
    }

    /** As `AeAccountHdWallet.signTransaction` asks to sign an aepp's transaction */
    async function askToSign(txBase64, { protocol, limit = 100, spent = 0 } = {}) {
      vi.resetModules();
      localStorage.clear();
      const { usePermissions: useFreshPermissions } = await import('@/composables/permissions');
      const permissions = useFreshPermissions();
      permissions.resetPermissions();
      permissions.addPermission(buildPermission({
        transactionSignLimit: limit,
        transactionSignSpent: spent,
      }));

      const isSigned = await permissions.checkOrAskPermission(
        METHODS.sign,
        `https://${HOST}/`,
        {
          onAccount: SENDER,
          aeppOrigin: `https://${HOST}`,
          ...protocol ? { aeppRpcClientId: 'client-id', protocol } : {},
          txBase64,
          tx: unpackTx(txBase64),
        },
      );
      return { isSigned, spent: permissions.permissions.value[HOST].transactionSignSpent };
    }

    it('signs a spend of a connected aepp without a modal, and counts it', async () => {
      const result = await askToSign(buildTx(Tag.SpendTx), { protocol: 'aeternity' });

      // The amount and the fee
      expect(result).toEqual({ isSigned: true, spent: 2.0002 });
      expect(openModalMock).not.toHaveBeenCalled();
    });

    it('signs a name claim of a connected aepp without a modal, and counts its name fee', async () => {
      const result = await askToSign(buildTx(Tag.NameClaimTx), { protocol: 'aeternity' });

      // The name fee and the fee
      expect(result).toEqual({ isSigned: true, spent: 0.0989 });
      expect(openModalMock).not.toHaveBeenCalled();
    });

    it.each([
      ['comes by a deep link, which names no protocol', 'SpendTx', undefined, 0],
      ['spends over the limit', 'SpendTx', 'aeternity', 99],
      ['calls a contract, which can spend more than it shows', 'ContractCallTx', 'aeternity', 0],
      ['is for another protocol', 'SpendTx', 'ethereum', 0],
    ])('asks to sign a transaction that %s, and counts nothing', async (_, tagName, protocol, spent) => {
      const result = await askToSign(buildTx(Tag[tagName]), { protocol, spent });

      expect(result).toEqual({ isSigned: true, spent });
      expect(openModalMock).toHaveBeenCalledOnce();
    });

    describe('in the background page of the extension', () => {
      /** It keeps the keys after the wallet locks, so only the session key tells it's unlocked */
      const openPopupMock = vi.fn();
      const getSessionEncryptionKeyMock = vi.fn();

      beforeEach(() => {
        openPopupMock.mockReset().mockResolvedValue({});
        vi.doMock('@/constants', async (importOriginal) => ({
          ...(await importOriginal()),
          IS_OFFSCREEN_TAB: true,
        }));
        vi.doMock('@/offscreen/popupHandler', () => ({
          openPopup: openPopupMock,
          getSessionEncryptionKey: getSessionEncryptionKeyMock,
        }));
      });

      afterEach(() => {
        vi.doUnmock('@/constants');
        vi.doUnmock('@/offscreen/popupHandler');
      });

      it('signs a spend under the limit while the wallet is unlocked', async () => {
        getSessionEncryptionKeyMock.mockResolvedValue('session-key');

        const result = await askToSign(buildTx(Tag.SpendTx), { protocol: 'aeternity' });

        expect(result).toEqual({ isSigned: true, spent: 2.0002 });
        expect(openPopupMock).not.toHaveBeenCalled();
      });

      it.each([
        ['locked', () => getSessionEncryptionKeyMock.mockResolvedValue(null)],
        ['unreachable', () => getSessionEncryptionKeyMock.mockRejectedValue(new Error('No receiver'))],
      ])('asks to sign a spend under the limit while the wallet is %s, and counts nothing', async (_, setSession) => {
        setSession();

        const result = await askToSign(buildTx(Tag.SpendTx), { protocol: 'aeternity' });

        expect(result).toEqual({ isSigned: true, spent: 0 });
        expect(openPopupMock).toHaveBeenCalledOnce();
      });
    });
  });
});
