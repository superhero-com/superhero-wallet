import { enableAutoUnmount, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter, RouterLink } from 'vue-router';
import TransactionListItem from '@/popup/components/TransactionListItem.vue';
import {
  ROUTE_ACCOUNT_TX_DETAILS,
  ROUTE_COIN_TX_DETAILS,
  ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS,
  ROUTE_MULTISIG_TX_DETAILS,
  ROUTE_TX_DETAILS,
} from '@/popup/router/routeNames';

vi.mock('@/composables', async (importOriginal) => {
  const { ref } = await import('vue');
  return {
    ...(await importOriginal<typeof import('@/composables')>()),
    useCurrencies: () => ({ getFormattedAndRoundedFiat: () => '' }),
    useTransactionData: () => ({
      direction: ref('sent'),
      isDexPool: ref(false),
      isErrorTransaction: ref(false),
      transactionAssets: ref([]),
    }),
  };
});

enableAutoUnmount(afterEach);

const Page = { render: () => null };
const TRANSACTION = {
  hash: 'th_1',
  transactionOwner: 'ak_1',
  protocol: 'aeternity',
  microTime: 1656518730553,
  tx: { type: 'SpendTx' },
};

function mountItem(props: Record<string, unknown>) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Page },
      { path: '/account/transactions/:hash/:transactionOwner', name: ROUTE_ACCOUNT_TX_DETAILS, component: Page },
      { path: '/account-details/transactions/:hash/:transactionOwner', name: ROUTE_TX_DETAILS, component: Page },
      { path: '/coins/:id/transactions/:hash/:transactionOwner', name: ROUTE_COIN_TX_DETAILS, component: Page },
      { path: '/multisig/details/transactions/:hash/:transactionOwner', name: ROUTE_MULTISIG_TX_DETAILS, component: Page },
      { path: '/multisig/details/multisig-proposals', name: ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS, component: Page },
    ],
  });
  const wrapper = mount(TransactionListItem, {
    props,
    global: {
      plugins: [router],
      stubs: { TransactionAssetRows: true, TransactionLabel: true, ConsensusApprovedLabel: true },
    },
  });
  const link = wrapper.getComponent(RouterLink);
  return { href: link.attributes('href'), replace: link.props('replace') };
}

describe('TransactionListItem', () => {
  // X keeps the pages under the one it closes, and opening one again shows the previous account
  it('replaces the list page by the transaction details', () => {
    expect(mountItem({ transaction: TRANSACTION })).toEqual({
      href: '/account-details/transactions/th_1/ak_1',
      replace: true,
    });
  });

  it('opens the transaction details route of the page it is on', () => {
    const transactionRoute = { name: ROUTE_COIN_TX_DETAILS, params: { id: 'aeternity' } };

    expect(mountItem({ transaction: TRANSACTION, transactionRoute })).toEqual({
      href: '/coins/aeternity/transactions/th_1/ak_1',
      replace: true,
    });
  });

  it('opens the transaction details over the dashboard, keeping it in the history', () => {
    expect(mountItem({
      transaction: TRANSACTION,
      transactionRoute: { name: ROUTE_ACCOUNT_TX_DETAILS },
      keepsPage: true,
    })).toEqual({ href: '/account/transactions/th_1/ak_1', replace: false });
  });

  it('replaces the page for multisig transactions and proposals', () => {
    expect(mountItem({ transaction: TRANSACTION, isMultisig: true })).toEqual({
      href: '/multisig/details/transactions/th_1/ak_1',
      replace: true,
    });
    expect(mountItem({
      multisigTransaction: {
        ...TRANSACTION,
        tx: { senderId: 'ak_1' },
        confirmationsRequired: 2,
        confirmedBy: [],
        signers: [],
      },
    })).toEqual({ href: '/multisig/details/multisig-proposals', replace: true });
  });
});
