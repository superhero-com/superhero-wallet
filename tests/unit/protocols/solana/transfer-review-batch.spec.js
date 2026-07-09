/* eslint-disable global-require */
import { mount } from '@vue/test-utils';

// Share a single adapter instance across component and assertions
const mockAdapter = {
  coinContractId: 'SOL',
  spendBatch: vi.fn(async (_amount, recipients) => (
    [{ hash: 'sig-batch', recipients }]
  )),
  transferTokenBatch: vi.fn(async (_amount, recipients) => (
    [{ hash: 'sig-batch-token', recipients }]
  )),
};

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: () => 'locale-specific-text',
  })),
}));

vi.mock('@/lib/ProtocolAdapterFactory', () => ({
  ProtocolAdapterFactory: {
    getAdapter: vi.fn(() => mockAdapter),
  },
}));

vi.mock('@/composables', () => ({
  useAccounts: () => ({
    activeAccount: { value: { address: 'SENDER', protocol: 'solana', name: 'Sender' } },
    getLastActiveProtocolAccount: () => ({ address: 'SENDER' }),
  }),
  useLatestTransactionList: () => ({
    addAccountPendingTransaction: vi.fn(),
  }),
  useUi: () => ({
    homeRouteName: { value: 'home' },
  }),
}));

// Import component AFTER mocks
const TransferReview = (await import('@/protocols/solana/components/TransferReview.vue')).default;

describe('Solana TransferReview - batch', () => {
  it('uses spendBatch when multiple recipients and SOL is selected', async () => {
    const wrapper = mount(TransferReview, {
      props: {
        transferData: {
          amount: '1',
          addresses: ['REC1', 'REC2'],
          selectedAsset: { contractId: 'SOL', symbol: 'SOL' },
        },
      },
      global: {
        stubs: { AvatarWithChainName: true, DetailsItem: true, TokenAmount: true },
        mocks: {
          $t: () => 't',
        },
      },
    });

    await wrapper.vm.submit();

    const { ProtocolAdapterFactory } = (await import('@/lib/ProtocolAdapterFactory'));
    const adapter = ProtocolAdapterFactory.getAdapter();
    expect(adapter.spendBatch).toHaveBeenCalledTimes(1);
    expect(adapter.spendBatch).toHaveBeenCalledWith(1, ['REC1', 'REC2'], { fromAccount: 'SENDER' });
  });

  it('uses transferTokenBatch when multiple recipients and token is selected', async () => {
    const wrapper = mount(TransferReview, {
      props: {
        transferData: {
          amount: '5',
          addresses: ['REC1', 'REC2', 'REC3'],
          selectedAsset: { contractId: 'TOKEN', symbol: 'TOK' },
        },
      },
      global: {
        stubs: { AvatarWithChainName: true, DetailsItem: true, TokenAmount: true },
        mocks: {
          $t: () => 't',
        },
      },
    });

    await wrapper.vm.submit();

    const { ProtocolAdapterFactory } = (await import('@/lib/ProtocolAdapterFactory'));
    const adapter = ProtocolAdapterFactory.getAdapter();
    expect(adapter.transferTokenBatch).toHaveBeenCalledTimes(1);
    expect(adapter.transferTokenBatch).toHaveBeenCalledWith('5', ['REC1', 'REC2', 'REC3'], 'TOKEN', { fromAccount: 'SENDER' });
  });
});
