// @ts-nocheck
import { ref } from 'vue';
import { flushPromises } from '@vue/test-utils';

/**
 * The pending proposal of the active vault, as the dashboard and the vault's transactions show
 * it. Loaded when the proposal changes, and while its transaction is unverified with every poll.
 */
const TX_HASH = 'aa'.repeat(32);
const OTHER_TX_HASH = 'bb'.repeat(32);

describe('usePendingMultisigTransaction', () => {
  let activeMultisigAccount;
  let fetchActiveMultisigTx;
  let getTxs;

  const vault = (txHash) => ({
    gaAccountId: 'ak_vault',
    contractId: 'ct_vault',
    txHash,
    hasPendingTransaction: true,
    confirmedBy: [],
  });
  /** As `fetchActiveMultisigTx` resolves the proposal the vault has now */
  const loaded = (isTxVerified) => async () => ({
    ...activeMultisigAccount.value,
    hash: activeMultisigAccount.value.txHash,
    isTxVerified,
  });

  beforeEach(async () => {
    vi.resetModules();
    activeMultisigAccount = ref(null);
    fetchActiveMultisigTx = vi.fn();
    getTxs = vi.fn().mockResolvedValue({ data: [{ tx: { function: 'propose' } }] });

    // Before `registerAdapters`, which loads the composables on the way
    vi.doMock('@/composables/multisigAccounts', () => ({
      useMultisigAccounts: () => ({ activeMultisigAccount }),
    }));
    vi.doMock('@/composables/multisigTransactions', () => ({
      useMultisigTransactions: () => ({ fetchActiveMultisigTx }),
    }));
    vi.doMock('@/protocols/aeternity/composables/aeMiddleware', () => ({
      useAeMiddleware: () => ({ getMiddleware: async () => ({ getTxs }) }),
    }));
    await import('@/protocols/registerAdapters');
  });

  async function usePending() {
    const { usePendingMultisigTransaction } = await import('@/composables/pendingMultisigTransaction');
    return usePendingMultisigTransaction();
  }

  /** As the next poll of the vault, with nothing changed */
  async function pollVault() {
    activeMultisigAccount.value = { ...activeMultisigAccount.value };
    await flushPromises();
  }

  it('loads an unverified proposal again with the next poll, until it is verified', async () => {
    const { pendingMultisigTransaction } = await usePending();
    fetchActiveMultisigTx.mockImplementation(loaded(false));
    activeMultisigAccount.value = vault(TX_HASH);
    await flushPromises();
    expect(pendingMultisigTransaction.value.isTxVerified).toBe(false);

    fetchActiveMultisigTx.mockImplementation(loaded(true));
    await pollVault();
    expect(pendingMultisigTransaction.value.isTxVerified).toBe(true);
    expect(fetchActiveMultisigTx).toHaveBeenCalledTimes(2);
    // The latest action of the vault didn't change with it
    expect(getTxs).toHaveBeenCalledTimes(1);

    await pollVault();
    expect(fetchActiveMultisigTx).toHaveBeenCalledTimes(2);
  });

  it('keeps the proposal the vault has now when an earlier one finishes loading last', async () => {
    const { pendingMultisigTransaction, isLoading } = await usePending();
    let resolveFirst;
    fetchActiveMultisigTx.mockImplementationOnce(() => new Promise((resolve) => {
      resolveFirst = resolve;
    }));
    activeMultisigAccount.value = vault(TX_HASH);
    await flushPromises();
    const first = { ...vault(TX_HASH), hash: TX_HASH, isTxVerified: true };

    fetchActiveMultisigTx.mockImplementation(loaded(false));
    activeMultisigAccount.value = vault(OTHER_TX_HASH);
    await flushPromises();
    resolveFirst(first);
    await flushPromises();

    expect(pendingMultisigTransaction.value).toMatchObject({
      hash: OTHER_TX_HASH,
      isTxVerified: false,
    });
    expect(isLoading.value).toBe(false);
  });
});
