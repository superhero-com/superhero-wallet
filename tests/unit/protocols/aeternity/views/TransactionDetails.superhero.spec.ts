import { enableAutoUnmount, mount } from '@vue/test-utils';
import type { ITransaction } from '@/types';
import { PROTOCOLS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { i18n } from '@/popup/plugins/i18n';
import {
  AE_NETWORK_MAINNET_ID,
  DEX_CONTRACTS,
  SUPERHERO_CONTRACTS,
} from '@/protocols/aeternity/config';
import { useAeSdk } from '@/composables/aeSdk';
import TransactionDetails from '@/protocols/aeternity/views/TransactionDetails.vue';
import SwapRoute from '@/popup/components/SwapRoute.vue';

const HASH = 'th_2QcxMg7FmhousM56HEagXQ6ke29FrddG98bSKKB9Z9gCibyxy6';
const CALLER = 'ak_AzQPCBHpxSdNURATT41CZANu8WTxtvxeUY33z4dgbDfyA6PtJ';
const TARGET = 'ak_FfKJsMbXte7J8JNAfZzxvEaVRLXvAtm857vWME4oJz33hFYnk';
const UNLISTED_SALE = 'ct_wS3iFu3UkvprrkreRdjJJ8RrK9tLou5LeBBSbiPbmf6g51gvt';
const contracts = SUPERHERO_CONTRACTS[AE_NETWORK_MAINNET_ID];

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useRoute: vi.fn(() => ({ params: { hash: HASH, transactionOwner: CALLER } })),
}));

let fetchMock: ReturnType<typeof vi.fn>;

function contractCall(contractId: string, fn: string, args: any[]): ITransaction {
  return {
    hash: HASH,
    protocol: PROTOCOLS.aeternity,
    transactionOwner: CALLER,
    tx: {
      type: 'ContractCallTx',
      callerId: CALLER,
      contractId,
      function: fn,
      arguments: args,
      amount: 0,
      fee: 30000000000000,
      returnType: 'ok',
    },
  } as unknown as ITransaction;
}

enableAutoUnmount(afterEach);

async function mountDetails(transaction: ITransaction) {
  vi.spyOn(ProtocolAdapterFactory.getAdapter(PROTOCOLS.aeternity), 'fetchTransactionByHash')
    .mockResolvedValue(transaction);
  const wrapper = mount(TransactionDetails, {
    shallow: true,
    global: {
      plugins: [i18n],
      stubs: {
        TransactionDetailsBase: false,
        PageWrapper: { template: '<div><slot /></div>' },
        DetailsItem: false,
      },
    },
  });
  await vi.waitFor(() => expect(wrapper.find('.content').exists()).toBe(true), 3000);
  return wrapper;
}

describe('Superhero transaction details', () => {
  beforeAll(() => {
    useAeSdk().nodeNetworkId.value = AE_NETWORK_MAINNET_ID;
  });

  beforeEach(() => {
    fetchMock = vi.fn(async () => new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([
    ['post', []],
    ['comment', [{ type: 'string', value: 'comment:13036_v3' }]],
  ])('shows the content of a %s', async (_, media) => {
    const wrapper = await mountDetails(contractCall(contracts.posts[0], 'post_without_tip', [
      { type: 'string', value: 'Hello world' },
      { type: 'list', value: media },
    ]));

    expect(wrapper.find('[data-cy=post-content]').text()).toContain('Hello world');
  });

  it.each([
    ['a Superhero rewards withdraw', contracts.affiliation[0], 'withdraw'],
    [
      'a swap entrypoint of another contract',
      'ct_2QFSEgsU4hknD3Wftxn3dHeTaYeYp4etVafNknaXJYK7QbLYbY',
      'swap_exact_ae_for_tokens',
    ],
  ])('shows no swap route for %s', async (_, contractId, fn) => {
    const wrapper = await mountDetails(contractCall(contractId, fn, []));

    expect(wrapper.findComponent(SwapRoute).exists()).toBe(false);
  });

  it('shows the swap route of a WAE withdraw', async () => {
    const [wae] = DEX_CONTRACTS[AE_NETWORK_MAINNET_ID].wae;
    const wrapper = await mountDetails(contractCall(wae, 'withdraw', [
      { type: 'int', value: '1000' },
    ]));

    expect(wrapper.findComponent(SwapRoute).exists()).toBe(true);
  });

  it('shows no content for other Superhero calls', async () => {
    const wrapper = await mountDetails(contractCall(contracts.socialGraph[0], 'follow', [
      { type: 'address', value: TARGET },
    ]));

    expect(wrapper.find('.transaction-details-base .content').exists()).toBe(true);
    expect(wrapper.find('[data-cy=post-content]').exists()).toBe(false);
  });

  it('looks up the sale of a buy missing from the token sales', async () => {
    await mountDetails(contractCall(UNLISTED_SALE, 'buy', [{ type: 'int', value: '1' }]));

    await vi.waitFor(() => expect(fetchMock.mock.calls.map(([url]) => url))
      .toContainEqual(expect.stringMatching(new RegExp(`/tokens/${UNLISTED_SALE}$`))));
  });
});
