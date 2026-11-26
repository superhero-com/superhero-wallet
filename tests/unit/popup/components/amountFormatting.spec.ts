// @ts-nocheck
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import MainBalance from '@/popup/components/MainBalance.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import TokenAmountFormatted from '@/popup/components/TokenAmountFormatted.vue';
import TransactionDetailsPoolTokenRow from '@/popup/components/TransactionDetailsPoolTokenRow.vue';
import TransferReviewBase from '@/popup/components/TransferSend/TransferReviewBase.vue';

/**
 * #2648: a balance of 4.99983 AE read "5.00", more than the account holds.
 */
vi.mock('@/lib/ProtocolAdapterFactory', () => ({
  ProtocolAdapterFactory: {
    getAdapter: () => ({
      coinSymbol: 'AE',
      getAmountPrecision: () => 9,
      normalizeAddress: (address) => address,
    }),
  },
}));
vi.mock('@/composables', () => ({
  useAccounts: () => ({ activeAccount: { address: 'ak_sender' } }),
  useCurrencies: () => ({ getFormattedAndRoundedFiat: () => '' }),
}));

describe('MainBalance', () => {
  const getBalance = (balance) => {
    const wrapper = mount(MainBalance, { props: { balance, protocol: 'aeternity' } });
    return [wrapper.find('.asset-integer').text(), wrapper.find('.asset-fractional').text()];
  };

  it('cuts the balance down to 6 significant digits', () => {
    expect(getBalance(4.99983082)).toEqual(['4.', '99983']);
    expect(getBalance(0.999)).toEqual(['0.', '999']);
    expect(getBalance(1234.5678)).toEqual(['1,234.', '56']);
  });

  it('keeps 2 decimals', () => {
    expect(getBalance(5)).toEqual(['5.', '00']);
  });
});

describe('TokenAmount', () => {
  const getAmount = async (props) => {
    const wrapper = mount(TokenAmount, {
      props: { protocol: 'aeternity', hideSymbol: true, ...props },
    });
    await nextTick();
    return wrapper.find('.amount').text();
  };

  it('cuts the amount down to 6 significant digits', async () => {
    expect(await getAmount({ amount: 4.99983082 })).toBe('4.99983');
    expect(await getAmount({ amount: 0.999 })).toBe('0.999');
  });

  it('shows every decimal in high precision', async () => {
    expect(await getAmount({ amount: 10.00018244, highPrecision: true })).toBe('10.00018244');
  });
});

describe('TokenAmountFormatted', () => {
  const getAmount = (amount) => mount(TokenAmountFormatted, { props: { amount, isReceived: true } })
    .text();

  it('cuts the amount down to 6 significant digits', () => {
    expect(getAmount('4.99983082')).toBe('4.99983');
    expect(getAmount('0.999')).toBe('0.999');
    expect(getAmount('99999.999')).toBe('99,999.99');
  });

  it('abbreviates large amounts cut down', () => {
    expect(getAmount('1999999')).toBe('1.99M');
  });
});

describe('review and sign screens', () => {
  it('show every decimal of the amount sent to each and all recipients', async () => {
    const wrapper = mount(TransferReviewBase, {
      props: {
        baseTokenSymbol: 'AE',
        protocol: 'aeternity',
        transferData: {
          amount: '4.99901678',
          fee: 0.00001686,
          addresses: ['ak_first', 'ak_second'],
          selectedAsset: { symbol: 'AE' },
        },
      },
      global: {
        mocks: { $t: (key) => key },
        stubs: { ModalHeader: true, AvatarWithChainName: true, PayloadDetails: true },
      },
    });
    await nextTick();

    expect(wrapper.findAll('[data-cy=review-amount] .amount').map((row) => row.text()))
      .toEqual(['4.99901678 AE', '9.99803356 AE']);
  });

  it('show every decimal of a token amount to sign', async () => {
    const wrapper = mount(TransactionDetailsPoolTokenRow, {
      props: { token: { amount: '4999016780000000000', decimals: 18, symbol: 'TKN' } },
      global: { stubs: { Tokens: true, AddressTruncated: true } },
    });
    await nextTick();

    expect(wrapper.find('.amount').text()).toBe('4.99901678');
  });
});
