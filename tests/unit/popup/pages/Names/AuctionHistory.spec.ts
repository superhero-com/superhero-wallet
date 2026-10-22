// @ts-nocheck
import { mount } from '@vue/test-utils';
import BigNumber from 'bignumber.js';

/**
 * `fetchNameAuction` drops bids made through a contract call, so an auction can have none
 * the wallet can show. The highest bid then comes from the node, or is `undefined` when the
 * node can't tell either.
 */
const { auction, getNameAuctionHighestBid } = vi.hoisted(() => {
  vi.resetModules();
  return {
    auction: { expiration: 1000, bids: [] },
    getNameAuctionHighestBid: vi.fn(),
  };
});

vi.mock('@/protocols/aeternity/composables/aeNames', () => ({
  useAeNames: () => ({
    getNameAuction: () => auction,
    getNameAuctionHighestBid,
    getName: () => ({ value: '' }),
  }),
}));
vi.mock('@/composables/topHeader', () => ({
  useTopHeaderData: () => ({ topBlockHeight: { value: 900 } }),
}));

const TokenAmountStub = {
  props: ['amount'],
  template: '<span data-cy="amount">{{ amount }}</span>',
};
const AccountItemStub = {
  props: ['address'],
  template: '<span data-cy="account">{{ address }}</span>',
};

function mountWithStubs(component) {
  return mount(component, {
    props: { name: 'test.chain' },
    global: {
      mocks: { $t: (key) => key },
      stubs: {
        IonPage: { template: '<div><slot /></div>' },
        IonContent: { template: '<div><slot /></div>' },
        TokenAmount: TokenAmountStub,
        AccountItem: AccountItemStub,
      },
    },
  });
}

describe('auction with no bids the wallet can show', () => {
  beforeEach(() => {
    auction.bids = [];
    getNameAuctionHighestBid.mockReturnValue(undefined);
  });

  it('shows a zero highest bid in the overview', async () => {
    const { default: AuctionOverview } = await import('@/popup/components/AuctionOverview.vue');

    const wrapper = mountWithStubs(AuctionOverview);

    expect(wrapper.find('[data-cy=amount]').text()).toBe('0');
    expect(wrapper.text()).toContain('1000');
  });

  it('shows the history without a highest bidder', async () => {
    const { default: AuctionHistory } = await import('@/popup/pages/Names/AuctionHistory.vue');

    const wrapper = mountWithStubs(AuctionHistory);

    expect(wrapper.find('[data-cy=account]').exists()).toBe(false);
    expect(wrapper.find('[data-cy=amount]').text()).toBe('0');
  });

  it('shows the highest bidder and the previous bids', async () => {
    const highest = { accountId: 'ak_carol', nameFee: new BigNumber(500) };
    auction.bids = [highest, { accountId: 'ak_alice', nameFee: new BigNumber(352.38) }];
    getNameAuctionHighestBid.mockReturnValue(highest);
    const { default: AuctionHistory } = await import('@/popup/pages/Names/AuctionHistory.vue');

    const wrapper = mountWithStubs(AuctionHistory);

    expect(wrapper.findAll('[data-cy=account]').map((item) => item.text()))
      .toEqual(['ak_carol', 'ak_alice']);
    expect(wrapper.findAll('[data-cy=amount]').map((item) => item.text()))
      .toEqual(['500', '352.38']);
  });

  // The node's highest bid is a copy, or one the middleware didn't list with its amount
  it.each([
    ['a copy of the highest listed bid', { accountId: 'ak_carol', nameFee: new BigNumber(500) }, [
      ['ak_carol', 'ak_alice'],
      ['500', '352.38'],
    ]],
    ['a bid made by a contract call', { accountId: 'ak_dave', nameFee: new BigNumber(600) }, [
      ['ak_dave', 'ak_carol', 'ak_alice'],
      ['600', '500', '352.38'],
    ]],
  ])('shows the highest bid from the node when it is %s', async (_, highest, [accounts, amounts]) => {
    auction.bids = [
      { accountId: 'ak_carol', nameFee: new BigNumber(500) },
      { accountId: 'ak_alice', nameFee: new BigNumber(352.38) },
    ];
    getNameAuctionHighestBid.mockReturnValue(highest);
    const { default: AuctionHistory } = await import('@/popup/pages/Names/AuctionHistory.vue');

    const wrapper = mountWithStubs(AuctionHistory);

    expect(wrapper.findAll('[data-cy=account]').map((item) => item.text())).toEqual(accounts);
    expect(wrapper.findAll('[data-cy=amount]').map((item) => item.text())).toEqual(amounts);
  });
});
