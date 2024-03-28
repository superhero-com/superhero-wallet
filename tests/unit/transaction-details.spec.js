import { mount } from '@vue/test-utils';
import { STUB_ADDRESS } from '../../src/constants/stubs';
import Loader from '../../src/popup/components/Loader.vue';
import TransactionDetails from '../../src/protocols/aeternity/views/TransactionDetails.vue';

const hash = 'th_fxSJErbUC3WAqiURFSWhafRdxJC6wzbj5yUKmLTUte6bNWLB8';

const getTransactions = (hasError) => ({
  [STUB_ADDRESS]: [
    {
      blockHeight: 624848,
      hash,
      microIndex: 23,
      microTime: 1656518730553,
      tx: {
        abiVersion: 3,
        amount: 0,
        contractId: 'ct_MLXQEP12MBn99HL6WDaiTqDbG4bJQ3Q9Bzr57oLfvEkghvpFb',
        fee: 185260000000000,
        function: 'add_liquidity',
        gas: 150000,
        gasPrice: 1000000000,
        gasUsed: 21720,
        nonce: 55,
        result: hasError ? 'abort' : 'ok',
        return: hasError ? 'AedexV2Router: INSUFFICIENT_B_AMOUNT' : {},
        returnType: hasError ? 'revert' : 'ok',
        type: 'ContractCallTx',
        arguments: [
          {
            type: 'contract',
            value: 'ct_JDp175ruWd7mQggeHewSLS1PFXt9AzThCDaFedxon8mF8xTRF',
          },
          {
            type: 'contract',
            value: 'ct_28w7VyXS6UDNbyWZxZLtxpDKJorfpYyBQM4f9quseFEByUeDpb',
          },
          {
            type: 'int',
            value: '49611297801631435',
          },
          {
            type: 'int',
            value: '199181234068601216',
          },
          {
            type: 'int',
            value: '47130732911549864',
          },
          {
            type: 'int',
            value: '189222172365171156',
          },
          {
            type: 'address',
            value: 'ak_USd42orxJjEedPzUvFizdtEmURTGdVoiubu6LJoNmxAbcekK',
          },
          {
            type: 'variant',
            value: [
              1,
              {
                type: 'int',
                value: 1000,
              },
            ],
          },
          {
            type: 'int',
            value: 1656520528858,
          },
        ],
      },
    },
  ],
});

jest.mock('vue-router', () => ({
  useRouter: jest.fn(() => ({})),
  useRoute: jest.fn(() => ({
    params: {
      hash: '',
      transactionOwner: '',
    },
  })),
}));

jest.mock('../../src/composables/transactionList.ts', () => ({
  useTransactionList: jest.fn(() => ({
    transactionsLoaded: getTransactions(false),
  })),
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
      components: {
        Loader,
      },
      mocks: {
        $t: () => 'locale-specific-text',
        $te: () => true,
      },
    },
    props: {
      hash,
    },
  });
}

describe('Transaction Details', () => {
  it('should render', async () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.transaction-details').exists()).toBeTruthy();
  });

  //   it('should display all required fields', async () => {
  //     const wrapper = mountComponent();
  //     await wrapper.vm.$nextTick();

  //     expect(wrapper.find('[data-cy=hash]').exists()).toBeTruthy();
  //     expect(wrapper.find('[data-cy=timestamp]').exists()).toBeTruthy();
  //     expect(wrapper.find('[data-cy=block-height]').exists()).toBeTruthy();
  //     expect(wrapper.find('[data-cy=nonce]').exists()).toBeTruthy();
  //     expect(wrapper.find('[data-cy=total]').exists()).toBeTruthy();
  //     expect(wrapper.find('[data-cy=gas]').exists()).toBeTruthy();
  //     expect(wrapper.find('[data-cy=fee]').exists()).toBeTruthy();
  //     expect(wrapper.find('.explorer').exists()).toBeTruthy();
  //   });

  //   it('should not display hash before loading transaction', async () => {
  //     const wrapper = mountComponent();
  //     expect(wrapper.find('[data-cy=hash]').exists()).toBeFalsy();
  //   });
  // });

  // jest.mock('../../src/composables/transactionList.ts', () => ({
  //   useTransactionList: jest.fn(() => ({
  //     getTransactionByHash: () => getTransaction(true),
  //   })),
  // }));

  // describe('Transaction Details - hasError', () => {
  //   it('should display error message when result returned === "abort"', async () => {
  //     const wrapper = mountComponent();
  //     await wrapper.vm.$nextTick();
  //     expect(wrapper.find('[data-cy=reason]').exists()).toBeTruthy();
  //   });
});
