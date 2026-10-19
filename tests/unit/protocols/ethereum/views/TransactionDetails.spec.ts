// @ts-nocheck
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { PROTOCOLS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { EtherscanService } from '@/protocols/ethereum/libs/EtherscanService';
import TransactionAssetRows from '@/popup/components/TransactionAssetRows.vue';
import TransactionErrorStatus from '@/popup/components/TransactionErrorStatus.vue';
import TransactionDetails from '@/protocols/ethereum/views/TransactionDetails.vue';

/**
 * The details page of an EVM transaction the wallet fetches by its hash.
 */
const OWNER = '0x1111111111111111111111111111111111111111';
const CONTRACT = '0x5555555555555555555555555555555555555555';
const HASH = '0xc0ffee0000000000000000000000000000000000000000000000000000000001';

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { hash: HASH, transactionOwner: OWNER } }),
  useRouter: () => ({ push: vi.fn() }),
}));

enableAutoUnmount(afterEach);

/** Etherscan `txlist` row of a reverted call, normalised */
const getRevertedCall = (protocol) => EtherscanService.normalizeEtherscanTransactionStructure(
  protocol,
  {
    blockNumber: '19000000',
    timeStamp: '1700000000',
    hash: HASH,
    nonce: '7',
    from: OWNER,
    to: CONTRACT,
    value: '0',
    gas: '60000',
    gasPrice: '20000000000',
    isError: '1',
    txreceipt_status: '0',
    // swapExactTokensForTokens, not an ERC-20 call
    input: `0x38ed1739${'0'.repeat(64)}`,
    contractAddress: '',
    gasUsed: '30000',
    confirmations: '100',
    functionName: '',
  },
  OWNER,
);

let etherscanCalls;

async function mountDetails(protocol, transaction) {
  vi.spyOn(ProtocolAdapterFactory.getAdapter(protocol), 'fetchTransactionByHash')
    .mockResolvedValue(transaction);
  const wrapper = mount(TransactionDetails, {
    props: { protocol },
    shallow: true,
    global: {
      mocks: { $t: (key) => key },
      stubs: {
        TransactionDetailsBase: false,
        PageWrapper: { template: '<div><slot /></div>' },
      },
    },
  });
  await flushPromises();
  return wrapper;
}

describe('EVM transaction details', () => {
  beforeEach(() => {
    etherscanCalls = [];
    vi.spyOn(EtherscanService.prototype, 'fetchFromApi').mockImplementation(
      async function fetchFromApi(params) {
        etherscanCalls.push({ apiUrl: this.apiUrl, chainId: this.chainId, ...params });
        return { status: '0', message: 'NOTOK', result: '' };
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a reverted transaction as reverted, without a reason', async () => {
    const wrapper = await mountDetails(PROTOCOLS.bnb, getRevertedCall(PROTOCOLS.bnb));

    expect(wrapper.findComponent(TransactionErrorStatus).props('returnType')).toBe('revert');
    expect(wrapper.findComponent(TransactionAssetRows).props('error')).toBe(true);
    expect(wrapper.find('[data-cy="reason"]').exists()).toBe(false);
  });

  it('decodes the call data on the chain of the transaction', async () => {
    await mountDetails(PROTOCOLS.bnb, getRevertedCall(PROTOCOLS.bnb));

    expect(etherscanCalls).toEqual([
      expect.objectContaining({ chainId: '56', action: 'getabi', address: CONTRACT }),
    ]);
  });

  it('shows no error for a successful transaction', async () => {
    const transaction = getRevertedCall(PROTOCOLS.bnb);
    transaction.tx.returnType = undefined;
    const wrapper = await mountDetails(PROTOCOLS.bnb, transaction);

    expect(wrapper.findComponent(TransactionErrorStatus).exists()).toBe(false);
    expect(wrapper.findComponent(TransactionAssetRows).props('error')).toBe(false);
  });
});
