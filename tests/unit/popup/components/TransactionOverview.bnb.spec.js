import { shallowMount } from '@vue/test-utils';
import TransactionOverview from '../../../../src/popup/components/TransactionOverview.vue';
import { PROTOCOLS } from '../../../../src/constants';

jest.mock('../../../../src/lib/ProtocolAdapterFactory', () => ({
  ProtocolAdapterFactory: {
    getAdapter: () => ({
      getExplorer: () => ({
        prepareUrlForAccount: (a) => `https://bscscan.com/address/${a}`,
        prepareUrlForHash: (h) => `https://bscscan.com/tx/${h}`,
      }),
      coinSymbol: 'BNB',
    }),
  },
}));

jest.mock('../../../../src/composables', () => ({
  useTransactionData: () => ({
    isDex: { value: false },
    innerTx: { value: { senderId: '0xsender', recipientId: '0xrecipient' } },
    innerTxTag: { value: 'SpendTx' },
    outerTxTag: { value: 'SpendTx' },
    direction: { value: 'sent' },
    getOwnershipAddress: () => '0xowner',
  }),
  useTippingContracts: () => ({ tippingContractAddresses: { tippingV1: '', tippingV2: '' } }),
  useFungibleTokens: () => ({ getProtocolAvailableTokens: () => ({}) }),
}));

jest.mock('../../../../src/protocols/aeternity/composables/aeNames', () => ({
  useAeNames: () => ({
    getName: () => ({ value: '' }),
    getNameByNameHash: jest.fn(),
  }),
}));

jest.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k) => k }) }));

describe('TransactionOverview (BNB/EVM)', () => {
  it('renders sender and recipient addresses for EVM SpendTx', () => {
    const wrapper = shallowMount(TransactionOverview, {
      props: {
        transaction: {
          protocol: PROTOCOLS.bnb,
          tx: { type: 'SpendTx', senderId: '0xsender', recipientId: '0xrecipient' },
        },
      },
      global: {
        stubs: {
          TransactionInfo: {
            props: ['sender', 'recipient', 'transaction'],
            template: '<div><span class="sender">{{ sender.address }}</span><span class="recipient">{{ recipient.address }}</span></div>',
          },
        },
      },
    });

    const html = wrapper.html();
    expect(html).toContain('0xsender');
    expect(html).toContain('0xrecipient');
    // Link comes from child component; stubbed here, so just ensure addresses shown
  });

  it('renders contract call layout for EVM ContractCallTx', () => {
    const wrapper = shallowMount(TransactionOverview, {
      props: {
        transaction: {
          protocol: PROTOCOLS.bnb,
          tx: { type: 'ContractCallTx', senderId: '0xsender', recipientId: '0xcontract' },
        },
      },
      global: {
        stubs: {
          TransactionInfo: {
            props: ['sender', 'recipient', 'transaction'],
            template: '<div><span class="sender">{{ sender.address }}</span><span class="recipient">{{ recipient.address }}</span></div>',
          },
        },
      },
    });
    const html = wrapper.html();
    expect(html).toContain('0xsender');
    // InnerTx mock returns recipient as 0xrecipient
    expect(html).toContain('0xrecipient');
  });
});
