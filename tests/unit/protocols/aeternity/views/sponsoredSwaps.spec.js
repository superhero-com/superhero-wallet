import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { PROTOCOLS } from '@/constants';
import { useAeSdk } from '@/composables/aeSdk';
import { useFungibleTokens } from '@/composables/fungibleTokens';
import { useLatestTransactionList } from '@/composables/latestTransactionList';
import { AE_NETWORK_MAINNET_ID } from '@/protocols/aeternity/config';
import { i18n, tg } from '@/popup/plugins/i18n';
import TransactionAssetRows from '@/popup/components/TransactionAssetRows.vue';
import TransactionErrorStatus from '@/popup/components/TransactionErrorStatus.vue';
import TransactionListItem from '@/popup/components/TransactionListItem.vue';
import TokenAmountFormatted from '@/popup/components/TokenAmountFormatted.vue';
import SwapRoute from '@/popup/components/SwapRoute.vue';
import TransactionDetails from '@/protocols/aeternity/views/TransactionDetails.vue';
import { ACCOUNT, TOKEN, sponsoredSwap } from '../../../helpers/sponsoredSwap';

const route = vi.hoisted(() => ({ params: { hash: '', transactionOwner: '' } }));

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push: vi.fn() }),
}));

enableAutoUnmount(afterEach);

const { nodeNetworkId } = useAeSdk();
const { tokenBalances } = useFungibleTokens();
const { accountsTransactionsLatest } = useLatestTransactionList();

beforeEach(() => {
  nodeNetworkId.value = AE_NETWORK_MAINNET_ID;
  tokenBalances.value = [{
    protocol: PROTOCOLS.aeternity,
    contractId: TOKEN,
    decimals: 18,
    symbol: 'TEST',
    price: 5,
  }];
  accountsTransactionsLatest.value = {};
});

function mountListItem(transaction) {
  return mount(TransactionListItem, {
    props: { transaction },
    shallow: true,
    global: {
      plugins: [i18n],
      stubs: {
        ListItemWrapper: { template: '<div><slot /></div>' },
        TransactionAssetRows: false,
        TransactionLabel: false,
        TokenAmountFormatted: false,
      },
    },
  });
}

async function mountDetails(transaction) {
  route.params.hash = transaction.hash;
  route.params.transactionOwner = ACCOUNT;
  accountsTransactionsLatest.value = { [ACCOUNT]: [transaction] };
  const wrapper = mount(TransactionDetails, {
    shallow: true,
    global: {
      plugins: [i18n],
      stubs: {
        TransactionDetailsBase: false,
        TransactionErrorStatus: false,
        TransactionAssetRows: false,
        TokenAmountFormatted: false,
        DetailsItem: false,
        PageWrapper: { template: '<div><slot /></div>' },
        CopyText: { template: '<span><slot /></span>' },
      },
    },
  });
  await flushPromises();
  return wrapper;
}

function displayedAmounts(wrapper) {
  return wrapper.findAllComponents(TokenAmountFormatted)
    .map((component) => [component.props('amount'), component.props('isReceived')]);
}

describe('sponsored swap history rows', () => {
  it('shows the sold and received amounts of a successful swap', () => {
    const wrapper = mountListItem(sponsoredSwap());

    expect(displayedAmounts(wrapper)).toEqual([['10', false], ['2', true]]);
    expect(wrapper.find('.transaction-label .error').exists()).toBe(false);
  });

  it('shows a failed swap as failed', () => {
    const wrapper = mountListItem(sponsoredSwap('revert'));

    expect(wrapper.find('.transaction-label .error').exists()).toBe(true);
    expect(wrapper.findComponent(TransactionAssetRows).props('error')).toBe(true);
    expect(displayedAmounts(wrapper)).toEqual([['10', false], ['1.5', true]]);
  });
});

describe('sponsored swap details', () => {
  it('shows the amounts and route of a successful swap', async () => {
    const wrapper = await mountDetails(sponsoredSwap());

    expect(displayedAmounts(wrapper)).toEqual([['10', false], ['2', true]]);
    expect(wrapper.findComponent(SwapRoute).exists()).toBe(true);
    expect(wrapper.findComponent(TransactionErrorStatus).exists()).toBe(false);
  });

  it('shows the inner failure and its reason', async () => {
    const wrapper = await mountDetails(sponsoredSwap('revert'));

    expect(wrapper.findComponent(TransactionErrorStatus).text())
      .toContain(tg('pages.transactionDetails.revert'));
    expect(wrapper.get('[data-cy="reason"]').text())
      .toContain('AedexV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
    expect(wrapper.findComponent(TransactionAssetRows).props('error')).toBe(true);
    expect(wrapper.findComponent(SwapRoute).exists()).toBe(false);
  });
});
