import { mount } from '@vue/test-utils';
import Loader from '../../../../../src/popup/components/Loader.vue';
import TransactionDetails from '../../../../../src/protocols/aeternity/views/TransactionDetails.vue';

const hash = 'th_fxSJErbUC3WAqiURFSWhafRdxJC6wzbj5yUKmLTUte6bNWLB8';

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({})),
  useRoute: vi.fn(() => ({
    params: { hash: '', transactionOwner: '' },
  })),
}));

vi.mock('../../../../../src/composables/transactionList.ts', () => ({
  getCachedAccountTransactions: vi.fn(() => []),
}));

function mountComponent() {
  return mount(TransactionDetails, {
    shallow: true,
    global: {
      stubs: {
        Loader: false,
        TransactionDetailsBase: false,
        IonPage: false,
        IonContent: false,
      },
      components: { Loader },
      mocks: { $t: () => 'locale-specific-text', $te: () => true },
    },
    props: { hash },
  });
}

describe('Transaction Details', () => {
  it('should render', async () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.transaction-details').exists()).toBeTruthy();
  });
});
