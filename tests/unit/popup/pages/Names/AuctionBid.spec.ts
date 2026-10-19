// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { defineRule } from 'vee-validate';
import { ref } from 'vue';
import BigNumber from 'bignumber.js';
import en from '@/popup/locales/en-US.json';

/**
 * The Bid tab prices the next bid off the highest one, which can be a contract call bid the
 * middleware lists without its amount, or unknown until the auction is loaded.
 */
const { getNameAuctionHighestBid } = vi.hoisted(() => ({ getNameAuctionHighestBid: vi.fn() }));

vi.mock('@/protocols/aeternity/composables/aeNames', () => ({
  useAeNames: () => ({ getNameAuctionHighestBid }),
}));
vi.mock('@/composables/aeSdk', () => ({ useAeSdk: () => ({ getAeSdk: vi.fn() }) }));
vi.mock('@/composables/modals', () => ({ useModals: () => ({ openDefaultModal: vi.fn() }) }));
vi.mock('@/composables/ui', () => ({
  useUi: () => ({ isLoaderVisible: ref(false), setLoaderVisible: vi.fn() }),
}));
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => ({ push: vi.fn() }),
}));

// Registered by `veeValidate.ts`, which the page doesn't load by itself
['required', 'enough_coin', 'does_not_exceed_decimals'].forEach((rule) => defineRule(rule, () => true));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

const InputAmountStub = {
  props: ['modelValue', 'message'],
  emits: ['update:modelValue'],
  template: `<div>
    <input data-cy="amount" @input="$emit('update:modelValue', $event.target.value)" />
    <span data-cy="message">{{ message }}</span>
  </div>`,
};
const BtnMainStub = {
  props: ['disabled'],
  template: '<button :disabled="disabled"><slot /></button>',
};
const TokenAmountStub = { props: ['amount'], template: '<span data-cy="token-amount">{{ amount }}</span>' };

async function mountAuctionBid() {
  const { default: AuctionBid } = await import('@/popup/pages/Names/AuctionBid.vue');
  const wrapper = mount(AuctionBid, {
    props: { name: 'test.chain' },
    global: {
      plugins: [i18n],
      stubs: {
        IonPage: { template: '<div><slot /></div>' },
        IonContent: { template: '<div><slot /></div>' },
        AuctionCard: true,
        InputAmount: InputAmountStub,
        TokenAmount: TokenAmountStub,
        BtnMain: BtnMainStub,
      },
    },
  });
  await flushPromises();
  return wrapper;
}

describe('AuctionBid', () => {
  const fee = (wrapper) => +wrapper.find('[data-cy=token-amount]').text();
  const button = (wrapper) => wrapper.find('[data-cy=place-bid]');

  it('takes a contract call bid as the one to outbid', async () => {
    getNameAuctionHighestBid.mockReturnValue({ accountId: 'ak_dave', nameFee: new BigNumber(600) });
    const wrapper = await mountAuctionBid();

    expect(fee(wrapper)).toBeGreaterThan(0);
    await wrapper.find('[data-cy=amount]').setValue('630');
    expect(wrapper.find('[data-cy=message]').text())
      .toBe(en.pages.names.auctions['min-bid'].replace('{minBid}', '630'));
    expect(button(wrapper).attributes('disabled')).toBeDefined();

    await wrapper.find('[data-cy=amount]').setValue('631');
    expect(wrapper.find('[data-cy=message]').text()).toBe('');
    expect(button(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('opens while the highest bid is unknown, without letting a bid be placed', async () => {
    getNameAuctionHighestBid.mockReturnValue(undefined);
    const wrapper = await mountAuctionBid();

    expect(fee(wrapper)).toBeGreaterThan(0);
    await wrapper.find('[data-cy=amount]').setValue('1000');
    expect(button(wrapper).attributes('disabled')).toBeDefined();
  });
});
