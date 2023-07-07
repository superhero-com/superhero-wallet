import { shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import TransactionDetails from '../../src/popup/pages/TransactionDetails.vue';
import { AETERNITY_SYMBOL, NETWORK_ID_TESTNET } from '../../src/popup/utils';
import { testAccount } from '../../src/popup/utils/testsConfig';

const hash = 'th_fxSJErbUC3WAqiURFSWhafRdxJC6wzbj5yUKmLTUte6bNWLB8';

jest.mock('vue-router', () => ({
  useRouter: jest.fn(() => ({})),
}));

jest.mock('../../src/store/index.js', () => ({}));

function mountComponent({ hasError = false } = {}) {
  const testTransaction = {
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
  };

  const store = new Vuex.Store({
    state: {
      fungibleTokens: {
        availableTokens: {
          ct_JDp175ruWd7mQggeHewSLS1PFXt9AzThCDaFedxon8mF8xTRF: {
            contract: 'ct_JDp175ruWd7mQggeHewSLS1PFXt9AzThCDaFedxon8mF8xTRF',
            contract_txi: 27821843,
            decimals: 18,
            extensions: [
              'allowances',
            ],
            name: 'Wrapped Aeternity',
            symbol: 'WAE',
          },
          ct_28w7VyXS6UDNbyWZxZLtxpDKJorfpYyBQM4f9quseFEByUeDpb: {
            contract: 'ct_28w7VyXS6UDNbyWZxZLtxpDKJorfpYyBQM4f9quseFEByUeDpb',
            contract_txi: 27821844,
            decimals: 18,
            extensions: [
              'allowances',
              'mintable',
              'burnable',
              'swappable',
            ],
            name: 'TestAEX9-WaeP',
            symbol: 'TAEX9-WaeP',
          },
        },
      },
    },
    getters: {
      getTx: () => () => testTransaction,
      getTxType: () => () => 'provide liquidity',
      getTxSymbol: () => () => AETERNITY_SYMBOL,
      getTransactionTipUrl: () => () => '',
      getTxAmountTotal: () => () => 1,
      getTxDirection: () => () => 'sent',
      getExplorerPath: () => () => 'https://explorer.testnet.aeternity.io/transactions/th_fxSJErbUC3WAqiURFSWhafRdxJC6wzbj5yUKmLTUte6bNWLB8',
      isTransactionAex9: () => () => true,
      account: () => testAccount,
      accounts: () => [testAccount],
      activeNetwork: () => NETWORK_ID_TESTNET,
    },
  });

  return shallowMount(TransactionDetails, {
    global: {
      plugins: [store],
      stubs: { IonPage: false, IonContent: false },
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

  it('should display all required fields', async () => {
    const wrapper = mountComponent();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-cy=hash]').exists()).toBeTruthy();
    expect(wrapper.find('[data-cy=timestamp]').exists()).toBeTruthy();
    expect(wrapper.find('[data-cy=block-height]').exists()).toBeTruthy();
    expect(wrapper.find('[data-cy=nonce]').exists()).toBeTruthy();
    expect(wrapper.find('[data-cy=amount]').exists()).toBeTruthy();
    expect(wrapper.find('[data-cy=gas]').exists()).toBeTruthy();
    expect(wrapper.find('[data-cy=fee]').exists()).toBeTruthy();
    expect(wrapper.find('.explorer').exists()).toBeTruthy();
  });

  it('should display error message when result returned === "abort"', async () => {
    const wrapper = mountComponent({ hasError: true });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-cy=reason]').exists()).toBeTruthy();
  });

  it('should display only spinner before loading transaction', async () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.spinner').exists()).toBeTruthy();
    expect(wrapper.find('[data-cy=hash]').exists()).toBeFalsy();
  });
});
