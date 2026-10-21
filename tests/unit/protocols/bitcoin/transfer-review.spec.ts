import { mount } from '@vue/test-utils';
import BigNumber from 'bignumber.js';

const {
  mockAdapter,
  addAccountPendingTransaction,
  routerPush,
  loggerWrite,
} = vi.hoisted(() => ({
  mockAdapter: {
    coinSymbol: 'BTC',
    spend: vi.fn(),
  },
  addAccountPendingTransaction: vi.fn(),
  routerPush: vi.fn(),
  loggerWrite: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('@/lib/ProtocolAdapterFactory', () => ({
  ProtocolAdapterFactory: { getAdapter: () => mockAdapter },
}));

vi.mock('@/lib/logger', () => ({
  default: { write: loggerWrite },
}));

vi.mock('@/composables', () => ({
  useAccounts: () => ({
    activeAccount: { value: { address: 'SENDER', protocol: 'bitcoin' } },
    getLastActiveProtocolAccount: () => ({ address: 'SENDER' }),
  }),
  useLatestTransactionList: () => ({ addAccountPendingTransaction }),
  useUi: () => ({ homeRouteName: { value: 'home' } }),
}));

const TransferReview = (await import('@/protocols/bitcoin/components/TransferReview.vue')).default;

function mountReview(addresses: string[]) {
  return mount(TransferReview, {
    props: {
      transferData: {
        amount: '0.001',
        addresses,
        fee: new BigNumber(0.0002),
        selectedAsset: { contractId: 'bitcoin', symbol: 'BTC' },
      } as any,
    },
    global: {
      stubs: { TransferReviewBase: true, DetailsItem: true, TokenAmount: true },
      mocks: { $t: (key: string) => key },
    },
  });
}

describe('Bitcoin TransferReview - sending to several recipients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('splits the fee, records each send and waits only between sends', async () => {
    mockAdapter.spend
      .mockResolvedValueOnce({ hash: 'hash-1' })
      .mockResolvedValueOnce({ hash: 'hash-2' });
    const wrapper = mountReview(['REC1', 'REC2']);

    const submitted = (wrapper.vm as any).submit();
    await vi.advanceTimersByTimeAsync(9999);
    expect(mockAdapter.spend).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(mockAdapter.spend).toHaveBeenCalledTimes(2);
    expect(wrapper.emitted('success')).toHaveLength(1);
    await submitted;

    expect(mockAdapter.spend.mock.calls.map(([amount, recipient, { fee }]) => (
      [amount, recipient, fee]
    ))).toEqual([
      [0.001, 'REC1', 0.0001],
      [0.001, 'REC2', 0.0001],
    ]);
    expect(addAccountPendingTransaction.mock.calls.map(([, tx]) => tx.hash))
      .toEqual(['hash-1', 'hash-2']);
    expect(wrapper.emitted('success')).toHaveLength(1);
    expect(routerPush).toHaveBeenCalledWith({ name: 'home' });
  });

  it('stops at the first failed send and does not report success', async () => {
    mockAdapter.spend.mockRejectedValueOnce(new Error('bad-txns-inputs-missingorspent'));
    const wrapper = mountReview(['REC1', 'REC2']);

    const submitted = (wrapper.vm as any).submit();
    await vi.advanceTimersByTimeAsync(20000);
    await submitted;

    expect(mockAdapter.spend).toHaveBeenCalledTimes(1);
    expect(loggerWrite).toHaveBeenCalledTimes(1);
    expect(loggerWrite).toHaveBeenCalledWith(expect.objectContaining({
      message: 'bad-txns-inputs-missingorspent',
      modal: true,
    }));
    expect(addAccountPendingTransaction).not.toHaveBeenCalled();
    expect(wrapper.emitted('success')).toBeUndefined();
    expect(routerPush).not.toHaveBeenCalled();
    expect((wrapper.vm as any).loading).toBe(false);
  });

  it('leaves the review after a failure that follows a send, so Confirm cannot repeat it', async () => {
    mockAdapter.spend
      .mockResolvedValueOnce({ hash: 'hash-1' })
      .mockRejectedValueOnce(new Error('bad-txns-inputs-missingorspent'));
    const wrapper = mountReview(['REC1', 'REC2', 'REC3']);

    const submitted = (wrapper.vm as any).submit();
    await vi.advanceTimersByTimeAsync(20000);
    await submitted;

    expect(mockAdapter.spend).toHaveBeenCalledTimes(2);
    expect(addAccountPendingTransaction.mock.calls.map(([, tx]) => tx.hash)).toEqual(['hash-1']);
    expect(loggerWrite).toHaveBeenCalledTimes(1);
    expect(routerPush).toHaveBeenCalledTimes(1);
    expect(routerPush).toHaveBeenCalledWith({ name: 'home' });
    expect(wrapper.emitted('success')).toHaveLength(1);
    expect((wrapper.vm as any).loading).toBe(false);
  });

  it('ignores Confirm while the sends are running', async () => {
    mockAdapter.spend.mockResolvedValueOnce({ hash: 'hash-1' });
    const wrapper = mountReview(['REC1']);

    await Promise.all([(wrapper.vm as any).submit(), (wrapper.vm as any).submit()]);

    expect(mockAdapter.spend).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('success')).toHaveLength(1);
  });
});
