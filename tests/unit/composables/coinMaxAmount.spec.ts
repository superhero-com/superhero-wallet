// @ts-nocheck
import { ref } from 'vue';
import BigNumber from 'bignumber.js';
import { PROTOCOLS } from '@/constants';
import { AE_CONTRACT_ID } from '@/protocols/aeternity/config';

/**
 * `useCoinMaxAmount` is a pure `computed` (no network/async work), so `useBalances` is
 * the only external boundary that needs mocking. It's imported through the `@/composables`
 * barrel though, which is eagerly loaded by the global `registerAdapters` setup file - so
 * (per this repo's Vitest conventions) the mock must be registered with `vi.doMock` +
 * `vi.resetModules()` and `registerAdapters`/the composable re-imported dynamically inside
 * each test, or the mock is silently ignored and the real (unmocked) balance is used.
 * `ProtocolAdapterFactory` itself is left real so `isCoin` resolves against the actual
 * aeternity adapter's `coinContractId`.
 *
 * ---- Black-box reasoning (written before reading coinMaxAmount.ts) ----
 * - Single recipient, coin: max = balance - fee.
 *   e.g. balance 1.5 AE, fee 0.000175 AE -> max = 1.499825 AE.
 * - Real callers (bitcoin/dogecoin/ethereum TransferSendForm.vue) pre-multiply `fee` by
 *   the recipient count before passing it in, so for N recipients the composable's own
 *   contract is: max = (balance - fee_total) / N.
 *   e.g. balance 1.5, fee_total 0.000525 (= 0.000175 x 3), N=3 -> max = 0.499825 each.
 * - balance < fee -> max = 0, never negative.
 * - balance == fee exactly -> max = 0.
 * - Result must be FLOORED to the asset's `decimals`, never rounded up past what the
 *   balance actually supports (rounding up risks an "insufficient funds" broadcast).
 *   e.g. balance 1.56, fee 0.5, decimals=1 -> raw 1.06 -> floor 1.0 (NOT 1.1).
 * - Boundary: balance exactly 1 smallest unit above the fee -> max = that 1 unit.
 * - Token (non-coin) send: fee is paid in the native coin, not the token, so token max
 *   must NOT subtract the coin fee - it should be the full token balance.
 */

let balanceRef;

async function setup({ balance, fee }: { balance: string; fee: string }) {
  vi.resetModules();
  balanceRef = ref(new BigNumber(balance));
  vi.doMock('@/composables/balances', () => ({
    useBalances: () => ({ balance: balanceRef }),
  }));
  await import('@/protocols/registerAdapters');
  const { useCoinMaxAmount } = await import('@/composables/coinMaxAmount');
  const feeRef = ref(new BigNumber(fee));
  return { useCoinMaxAmount, feeRef };
}

function makeFormModel({
  decimals = 6,
  addressesCount = 1,
  contractId = AE_CONTRACT_ID,
  tokenAmount,
}: {
  decimals?: number;
  addressesCount?: number;
  contractId?: string;
  tokenAmount?: string;
} = {}) {
  const selectedAsset: any = {
    protocol: PROTOCOLS.aeternity,
    contractId,
    decimals,
  };
  if (tokenAmount !== undefined) {
    selectedAsset.amount = tokenAmount;
  }
  return ref({
    amount: '0',
    selectedAsset,
    addresses: Array.from({ length: addressesCount }, (_, i) => `ak_recipient_${i}`),
  });
}

describe('useCoinMaxAmount', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('single recipient: max = balance - fee', async () => {
    const { useCoinMaxAmount, feeRef } = await setup({ balance: '1.5', fee: '0.000175' });
    const formModel = makeFormModel({ decimals: 6, addressesCount: 1 });

    const { max } = useCoinMaxAmount({ formModel, fee: feeRef });

    expect(max.value).toBe('1.499825');
  });

  it('multi-recipient: pre-multiplied total fee is subtracted once, then split across recipients', async () => {
    // Caller convention: fee is already fee-per-recipient x N
    // (see e.g. bitcoin/TransferSendForm.vue).
    const { useCoinMaxAmount, feeRef } = await setup({
      balance: '1.5',
      fee: new BigNumber('0.000175').multipliedBy(3).toString(),
    });
    const formModel = makeFormModel({ decimals: 6, addressesCount: 3 });

    const { max } = useCoinMaxAmount({ formModel, fee: feeRef });

    expect(max.value).toBe('0.499825');
  });

  it('balance below the fee floors to zero, never negative', async () => {
    const { useCoinMaxAmount, feeRef } = await setup({ balance: '0.0001', fee: '0.000175' });
    const formModel = makeFormModel({ decimals: 6, addressesCount: 1 });

    const { max } = useCoinMaxAmount({ formModel, fee: feeRef });

    expect(max.value).toBe('0');
  });

  it('balance exactly equal to the fee yields zero', async () => {
    const { useCoinMaxAmount, feeRef } = await setup({ balance: '0.000175', fee: '0.000175' });
    const formModel = makeFormModel({ decimals: 6, addressesCount: 1 });

    const { max } = useCoinMaxAmount({ formModel, fee: feeRef });

    expect(max.value).toBe('0');
  });

  it('boundary: balance exactly 1 smallest unit above the fee', async () => {
    const { useCoinMaxAmount, feeRef } = await setup({ balance: '0.000176', fee: '0.000175' });
    const formModel = makeFormModel({ decimals: 6, addressesCount: 1 });

    const { max } = useCoinMaxAmount({ formModel, fee: feeRef });

    expect(max.value).toBe('0.000001');
  });

  // BUG: `.decimalPlaces(decimals)` in coinMaxAmount.ts (line 48) is called without an
  // explicit rounding mode, so it uses BigNumber.js's global default (ROUND_HALF_UP).
  // balance 1.56 - fee 0.5 = 1.06 exactly; the *actual* spendable amount at 1 decimal
  // is 1.0 (flooring), but ROUND_HALF_UP rounds 1.06 -> 1.1, which is MORE than the
  // wallet can actually send (1.1 + 0.5 fee = 1.6 > 1.56 balance) - a max-amount that
  // is guaranteed to fail broadcast as "insufficient funds". See TEST_IMPROVEMENT_PLAN.md
  // "Potential bugs found" #1.
  it.fails('max is floored (not rounded) to the asset decimals', async () => {
    const { useCoinMaxAmount, feeRef } = await setup({ balance: '1.56', fee: '0.5' });
    const formModel = makeFormModel({ decimals: 1, addressesCount: 1 });

    const { max } = useCoinMaxAmount({ formModel, fee: feeRef });

    expect(max.value).toBe('1'); // actual: '1.1'
  });

  it('token (non-coin) max ignores the native-coin fee entirely', async () => {
    // coin balance is irrelevant to a token send; fee is a large coin fee that must NOT
    // be subtracted from the token amount.
    const { useCoinMaxAmount, feeRef } = await setup({ balance: '0', fee: '0.5' });
    const formModel = makeFormModel({
      decimals: 6,
      addressesCount: 1,
      contractId: 'ct_some_other_token',
      tokenAmount: '100000000', // 100 tokens in smallest units at 6 decimals
    });

    const { max } = useCoinMaxAmount({ formModel, fee: feeRef });

    expect(max.value).toBe('100');
  });

  // Secondary finding (not part of the "ignores coin fee" case but discovered while
  // testing it): unlike the coin branch, the token branch never divides by the
  // recipient count. With 2 recipients, filling each amount field with the FULL token
  // balance would request 2x the wallet's actual token balance on submit. See
  // TEST_IMPROVEMENT_PLAN.md "Potential bugs found" #2.
  it.fails('token max is split across multiple recipients like the coin branch', async () => {
    const { useCoinMaxAmount, feeRef } = await setup({ balance: '0', fee: '0' });
    const formModel = makeFormModel({
      decimals: 6,
      addressesCount: 2,
      contractId: 'ct_some_other_token',
      tokenAmount: '100000000', // 100 tokens
    });

    const { max } = useCoinMaxAmount({ formModel, fee: feeRef });

    expect(max.value).toBe('50'); // actual: '100'
  });
});
