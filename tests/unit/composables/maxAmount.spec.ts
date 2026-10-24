// @ts-nocheck
import { ref } from 'vue';
import BigNumber from 'bignumber.js';
import { MemoryAccount, Tag, buildTx } from '@aeternity/aepp-sdk';
import { AE_CONTRACT_ID, AE_COIN_PRECISION } from '@/protocols/aeternity/config';
import { STUB_TIP_NOTE } from '@/constants/stubs';

/**
 * `useMaxAmount` (the aeternity-specific max-amount composable) computes its `fee` ref
 * through a debounced, `watch(..., { immediate: true })`-driven async flow that normally
 * talks to the aeternity SDK (`aeSdk.buildTx` + `unpackTx`) to estimate a spend fee. That
 * network/SDK round trip isn't something a unit test should exercise directly.
 *
 * To drive `fee.value` deterministically without touching the SDK, these tests go through
 * the composable's `multisigVault` code path: when a `multisigVault` option is supplied,
 * `useMaxAmount` calls `useMultisigTransactions().proposeTx(...)` (mocked here) instead of
 * building/unpacking a real transaction, and sets `fee.value` straight from the mocked
 * result's `tx.fee`. This exercises the exact same `max` computed formula the "normal"
 * (non-multisig) send path uses - it's a legitimate boundary to mock (an RPC/contract-call
 * boundary), not a reinterpretation of the math under test.
 *
 * As with other specs in this repo, `useBalances`/`useAccounts`/`useAeSdk`/
 * `useMultisigTransactions`/`useTippingContracts` are mocked via `vi.doMock` +
 * `vi.resetModules()` + a dynamic re-import of `registerAdapters` and the composable under
 * test, because the `@/composables` barrel (loaded eagerly by the global `registerAdapters`
 * setup file) would otherwise cache the real modules before a static `vi.mock` could apply.
 *
 * ---- Black-box reasoning (written before reading maxAmount.ts) ----
 * - Single recipient, coin (AE): max = balance - fee.
 *   e.g. balance 1.5 AE, fee 0.000175 AE -> max = 1.499825 AE.
 * - balance < fee -> max = 0, never negative.
 * - balance == fee exactly -> max = 0.
 * - Result must be FLOORED to the asset's decimals, never rounded up past what the balance
 *   actually supports.
 *   e.g. balance 1.56, fee 0.5, decimals=1 -> raw 1.06 -> floor 1.0 (NOT 1.1).
 * - N recipients: fee scales linearly with N (each recipient needs its own fee), i.e.
 *   max = (balance - fee x N) / N.
 *   e.g. balance 3 AE, fee 0.0001 AE, N=3 -> (3 - 0.0003) / 3 = 0.9999 AE each.
 * - Token (non-coin) send: fee is paid in AE, not the token, so token max must NOT
 *   subtract the AE fee, even if a nonzero AE fee was already computed for a prior AE
 *   selection in the same form.
 */

const mockTokenInstance = {
  $options: { address: 'ct_mock_token' },
  transfer: vi.fn(async () => { throw new Error('static call skipped in test'); }),
  balance: vi.fn(async () => ({ decodedResult: '0' })),
};

vi.mock('@aeternity/aepp-sdk', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    Contract: { initialize: vi.fn(async () => mockTokenInstance) },
  };
});

let balanceRef;
let proposeTxMock;
let getAeSdkMock;
let getTippingContractsMock;

const SENDER_ADDRESS = 'ak_2QAFYFFEKR75mnyxo3fJKrCiCU3Rmf9AbYXd6uURXY8Zzp3ndd';

async function setup({ balance }: { balance: string }) {
  vi.resetModules();
  balanceRef = ref(new BigNumber(balance));
  proposeTxMock = vi.fn();
  getTippingContractsMock = vi.fn(async () => ({ tippingV1: null, tippingV2: null }));
  getAeSdkMock = vi.fn(async () => ({
    buildTx: vi.fn(async () => 'tx_stub'),
    getContext: () => ({}),
    getHeight: vi.fn(async () => 100),
  }));

  vi.doMock('@/composables/balances', () => ({
    useBalances: () => ({ balance: balanceRef }),
  }));
  vi.doMock('@/composables/accounts', () => ({
    useAccounts: () => ({ getLastActiveProtocolAccount: () => ({ address: SENDER_ADDRESS }) }),
  }));
  vi.doMock('@/composables/aeSdk', () => ({
    useAeSdk: () => ({ getAeSdk: getAeSdkMock }),
  }));
  vi.doMock('@/composables/multisigTransactions', () => ({
    useMultisigTransactions: () => ({ proposeTx: proposeTxMock }),
  }));
  vi.doMock('@/composables/tippingContracts', () => ({
    useTippingContracts: () => ({ getTippingContracts: getTippingContractsMock }),
  }));

  await import('@/protocols/registerAdapters');
  const { useMaxAmount } = await import('@/composables/maxAmount');
  return { useMaxAmount };
}

function makeFormModel({ decimals = 6, addressesCount = 1, contractId = AE_CONTRACT_ID } = {}) {
  return ref({
    amount: '1',
    selectedAsset: { protocol: 'aeternity', contractId, decimals },
    addresses: Array.from({ length: addressesCount }, (_, i) => `ak_recipient_${i}`),
  });
}

const MULTISIG_VAULT = { gaAccountId: 'ak_multisig_vault', contractId: 'ct_multisig_vault' } as any;

// Resolves `proposeTx` with a `tx.fee` (in aettos, i.e. the *per-recipient* fee the SDK
// would report for one spend) and zeroed gas so `fee.value` ends up as exactly
// `aeFee x recipientsCount`, matching the real (non-multisig) code path's use of the
// per-tx fee before `max`'s own `x recipientsCount` multiplication.
function mockFeeAe(aeFeePerTx: string, recipientsCount = 1) {
  const aettos = new BigNumber(aeFeePerTx).shiftedBy(AE_COIN_PRECISION);
  proposeTxMock.mockResolvedValue({
    callResult: {
      result: { gasUsed: '0', gasPrice: '0' },
      tx: { fee: aettos.toNumber() },
    },
  });
  return recipientsCount;
}

async function waitForFee(result: any) {
  await vi.waitFor(() => {
    if (result.fee.value.toString() === '0') throw new Error('fee not yet computed');
  }, { timeout: 2000, interval: 10 });
}

describe('useMaxAmount', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('single recipient: max = balance - fee', async () => {
    const { useMaxAmount } = await setup({ balance: '1.5' });
    mockFeeAe('0.000175');
    const formModel = makeFormModel({ decimals: 6, addressesCount: 1 });

    const result = useMaxAmount({ formModel, multisigVault: MULTISIG_VAULT });
    await waitForFee(result);

    expect(result.max.value).toBe('1.499825');
  });

  it('balance below the fee floors to zero, never negative', async () => {
    const { useMaxAmount } = await setup({ balance: '0.0001' });
    mockFeeAe('0.000175');
    const formModel = makeFormModel({ decimals: 6, addressesCount: 1 });

    const result = useMaxAmount({ formModel, multisigVault: MULTISIG_VAULT });
    await waitForFee(result);

    expect(result.max.value).toBe('0');
  });

  it('balance exactly equal to the fee yields zero', async () => {
    const { useMaxAmount } = await setup({ balance: '0.000175' });
    mockFeeAe('0.000175');
    const formModel = makeFormModel({ decimals: 6, addressesCount: 1 });

    const result = useMaxAmount({ formModel, multisigVault: MULTISIG_VAULT });
    await waitForFee(result);

    expect(result.max.value).toBe('0');
  });

  // `.decimalPlaces(decimals, BigNumber.ROUND_DOWN)` in maxAmount.ts floors rather than
  // rounds: balance 1.56 - fee 0.5 = 1.06 exactly; the actual spendable amount at 1
  // decimal is 1.0. Rounding up here would offer a "max" the wallet can't actually send
  // (1.1 + 0.5 fee = 1.6 > 1.56 balance). Same fix as coinMaxAmount.spec.ts's equivalent
  // case.
  it('max is floored (not rounded) to the asset decimals', async () => {
    const { useMaxAmount } = await setup({ balance: '1.56' });
    mockFeeAe('0.5');
    const formModel = makeFormModel({ decimals: 1, addressesCount: 1 });

    const result = useMaxAmount({ formModel, multisigVault: MULTISIG_VAULT });
    await waitForFee(result);

    expect(result.max.value).toBe('1');
  });

  // For a multisig-vault proposal, `fee.value` is set to the PER-TX fee (`tx.fee`,
  // un-multiplied), and the `max` computed multiplies it by `recipientsCount` exactly
  // once - matching the plain (non-multisig) send path's convention.
  // balance 3 AE, per-tx fee 0.0001 AE, N=3 recipients:
  //   (3 - 0.0001*3) / 3 = 2.9997 / 3 = 0.9999 AE
  it('multisig multi-recipient fee scales linearly with recipient count', async () => {
    const { useMaxAmount } = await setup({ balance: '3' });
    const n = mockFeeAe('0.0001', 3);
    const formModel = makeFormModel({ decimals: 4, addressesCount: n });

    const result = useMaxAmount({ formModel, multisigVault: MULTISIG_VAULT });
    await waitForFee(result);

    expect(result.max.value).toBe('0.9999');
  });

  it('token (non-coin) max ignores an already-computed AE fee', async () => {
    const { useMaxAmount } = await setup({ balance: '1.5' });
    mockFeeAe('0.000175');
    const formModel = makeFormModel({ decimals: 6, addressesCount: 1 });

    const result = useMaxAmount({ formModel, multisigVault: MULTISIG_VAULT });
    await waitForFee(result);
    // Sanity check: a nonzero AE fee is actually in play before switching assets.
    expect(result.fee.value.toString()).not.toBe('0');

    // Switch the form to a token asset. The debounced watcher's trailing edge fires
    // ~500ms after the last change (lodash `debounce` leading+trailing), so this test
    // uses real timers and waits it out rather than faking timers (real WebCrypto/SDK
    // interplay elsewhere in this repo makes fake timers unreliable - see ground rules).
    formModel.value = {
      ...formModel.value,
      selectedAsset: { protocol: 'aeternity', contractId: 'ct_mock_token', decimals: 6 },
    };
    await new Promise((resolve) => { setTimeout(resolve, 700); });

    // The token branch returns `selectedTokenBalance` (0 here, since no balance fetch
    // occurred), never `balance - fee`. If the AE fee leaked into the token branch, this
    // would instead reflect balance-minus-fee arithmetic (or throw on unrelated decimals).
    expect(result.max.value).toBe('0');
  });
});

describe('useMaxAmount - tip to a URL', () => {
  const TIP_URL = 'https://example.com';

  // 1000 gas at 1e9 aettos and a fee of 0.0002 AE
  const DRY_RUN = {
    result: { gasUsed: 1000n, gasPrice: 1000000000n },
    tx: { fee: '200000000000000' },
  };

  const makeTipFormModel = () => ref({
    amount: '1',
    selectedAsset: { protocol: 'aeternity', contractId: AE_CONTRACT_ID, decimals: 18 },
    addresses: [TIP_URL],
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it('prices the tip by its dry run and counts the tipped amount in the total', async () => {
    const { useMaxAmount } = await setup({ balance: '5' });
    const tip = vi.fn(async () => DRY_RUN);
    getTippingContractsMock.mockResolvedValue({ tippingV1: null, tippingV2: { tip } });

    const result = useMaxAmount({ formModel: makeTipFormModel() });
    await waitForFee(result);

    expect(tip).toHaveBeenCalledWith(TIP_URL, STUB_TIP_NOTE, {
      amount: '1000000000000000000',
      waitMined: false,
      callStatic: true,
    });
    expect(result.fee.value.toFixed()).toBe('0.0002');
    // 1 AE + 1000 gas at 1e9 aettos + the fee
    expect(result.total.value.toFixed()).toBe('1.000201');
  });

  it('prices a token tip by its transfer and leaves the tokens out of the total', async () => {
    const { useMaxAmount } = await setup({ balance: '5' });
    const tip = vi.fn(async () => DRY_RUN);
    getTippingContractsMock.mockResolvedValue({ tippingV1: null, tippingV2: { tip } });
    mockTokenInstance.transfer.mockResolvedValue(DRY_RUN);
    try {
      const result = useMaxAmount({
        formModel: ref({
          ...makeTipFormModel().value,
          selectedAsset: { protocol: 'aeternity', contractId: 'ct_mock_token', decimals: 18 },
        }),
      });
      await waitForFee(result);

      expect(tip).not.toHaveBeenCalled();
      expect(result.fee.value.toFixed()).toBe('0.0002');
      // 1000 gas at 1e9 aettos + the fee, no AE amount
      expect(result.total.value.toFixed()).toBe('0.000201');
    } finally {
      // Back to the failing static call the other tests expect.
      mockTokenInstance.transfer.mockReset();
    }
  });

  it('drops the gas of the tip once the recipient is an account', async () => {
    const { useMaxAmount } = await setup({ balance: '5' });
    getTippingContractsMock.mockResolvedValue({
      tippingV1: null,
      tippingV2: { tip: async () => DRY_RUN },
    });
    const { address } = MemoryAccount.generate();
    getAeSdkMock.mockResolvedValue({
      buildTx: async () => buildTx({
        tag: Tag.SpendTx, senderId: address, recipientId: address, amount: 1, nonce: 1,
      }),
      getHeight: async () => 100,
    });
    const formModel = makeTipFormModel();

    const result = useMaxAmount({ formModel });
    await vi.waitFor(() => expect(result.gasUsed.value).toBe(1000));
    formModel.value = { ...formModel.value, addresses: [SENDER_ADDRESS] };

    await vi.waitFor(() => expect(result.gasUsed.value).toBe(0), { timeout: 2000 });
    expect(result.gasPrice.value).toBe(0);
  });

  it('keeps running on a network without tipping contracts', async () => {
    const onUnhandledRejection = vi.fn();
    process.on('unhandledRejection', onUnhandledRejection);
    try {
      const { useMaxAmount } = await setup({ balance: '5' });
      getTippingContractsMock.mockRejectedValue(new Error('failed to initialize tipping contract'));

      const result = useMaxAmount({ formModel: makeTipFormModel() });
      await vi.waitFor(() => expect(getTippingContractsMock).toHaveBeenCalled());
      await new Promise((resolve) => { setTimeout(resolve, 0); });

      expect(onUnhandledRejection).not.toHaveBeenCalled();
      expect(result.fee.value.toFixed()).toBe('0');
    } finally {
      process.off('unhandledRejection', onUnhandledRejection);
    }
  });
});
