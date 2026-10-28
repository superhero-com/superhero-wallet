// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import { AE_AMOUNT_FORMATS, MemoryAccount } from '@aeternity/aepp-sdk';
import en from '@/popup/locales/en-US.json';

/**
 * Redeeming moves the gift card funds, signed with the card key, to the chosen account.
 * Runs the real `claimInvite`; mocks the SDK, the accounts and the modals.
 */
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
const SECRET_KEY = Buffer.from('b'.repeat(64), 'hex');
const RECIPIENT = MemoryAccount.generate().address;
const OTHER_ACCOUNT = MemoryAccount.generate().address;

const AccountSelectorStub = {
  emits: ['update:modelValue'],
  template: `<button data-cy="choose-other-account" @click="$emit('update:modelValue', '${OTHER_ACCOUNT}')" />`,
};

const AmountStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input data-cy="amount" @input="$emit(\'update:modelValue\', $event.target.value)" />',
};
const BtnMainStub = {
  props: ['disabled', 'text'],
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>',
};

describe('ClaimGiftCard', () => {
  let getBalance;
  let dryAeSdk;
  let resolve;
  let wrapper;
  let cardAddress;

  beforeEach(async () => {
    vi.resetModules();

    getBalance = vi.fn().mockResolvedValue('5');
    dryAeSdk = {
      spend: vi.fn().mockResolvedValue({ hash: 'th_' }),
      transferFunds: vi.fn().mockResolvedValue({ hash: 'th_' }),
    };
    resolve = vi.fn();

    const mockComposable = (path, mocks) => vi.doMock(path, () => mocks);
    mockComposable('@/composables/aeSdk', {
      useAeSdk: () => ({
        getAeSdk: async () => ({ getBalance }),
        getDryAeSdk: async () => dryAeSdk,
      }),
    });
    mockComposable('@/composables/accounts', {
      useAccounts: () => ({
        aeAccounts: ref([{ address: RECIPIENT }, { address: OTHER_ACCOUNT }]),
        aeAccountsSelectOptions: ref([]),
      }),
    });
    mockComposable('@/composables/currencies', {
      useCurrencies: () => ({ getFormattedFiat: () => '$1.00' }),
    });
    mockComposable('@/composables/modals', { useModals: () => ({ openDefaultModal: vi.fn() }) });
    mockComposable('@/composables/auth', {
      useAuth: () => ({ encryptionKey: ref(null), isEncryptionKeyCurrent: () => true }),
    });
    await import('@/protocols/registerAdapters');

    const { getAccountFromSecret } = await import('@/protocols/aeternity/helpers');
    cardAddress = getAccountFromSecret(SECRET_KEY).address;
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  async function mountClaimGiftCard() {
    const { default: ClaimGiftCard } = await import('@/popup/components/Modals/ClaimGiftCard.vue');
    wrapper = mount(ClaimGiftCard, {
      props: { resolve, reject: vi.fn(), secretKey: SECRET_KEY },
      global: {
        plugins: [i18n],
        stubs: {
          Modal: { template: '<div><slot /><slot name="footer" /></div>' },
          AccountSelector: AccountSelectorStub,
          AccountItem: true,
          BalanceInfo: true,
          BtnMaxAmount: true,
          TransferSendAmount: AmountStub,
          BtnMain: BtnMainStub,
        },
      },
    });
    await flushPromises();
    return wrapper;
  }

  const mainButton = () => wrapper.find('[data-cy=redeem-main-btn]');

  it('redeems the full balance to the chosen account with the card key', async () => {
    await mountClaimGiftCard();
    expect(mainButton().text()).toBe(en.modals.claimGiftCard.redeemFull);

    await mainButton().trigger('click');
    await flushPromises();

    expect(dryAeSdk.spend).not.toHaveBeenCalled();
    expect(dryAeSdk.transferFunds).toHaveBeenCalledTimes(1);
    const [[fraction, recipientId, { onAccount }]] = dryAeSdk.transferFunds.mock.calls;
    expect([fraction, recipientId, onAccount.address]).toEqual([1, RECIPIENT, cardAddress]);
    expect(mainButton().text()).toBe(en.common.ok);
    expect(wrapper.find('[data-cy=redeem-secondary-btn]').exists()).toBe(false);

    await mainButton().trigger('click');
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it('redeems to another account of the wallet when it is chosen', async () => {
    await mountClaimGiftCard();

    await wrapper.find('[data-cy=choose-other-account]').trigger('click');
    await mainButton().trigger('click');
    await flushPromises();

    expect(dryAeSdk.transferFunds).toHaveBeenCalledTimes(1);
    const [[fraction, recipientId, { onAccount }]] = dryAeSdk.transferFunds.mock.calls;
    expect([fraction, recipientId, onAccount.address]).toEqual([1, OTHER_ACCOUNT, cardAddress]);
  });

  it('redeems the entered amount of AE', async () => {
    await mountClaimGiftCard();

    await wrapper.find('[data-cy=redeem-secondary-btn]').trigger('click');
    expect(mainButton().text()).toBe(en.modals.claimGiftCard.redeem);
    await wrapper.find('[data-cy=amount]').setValue('2');
    await mainButton().trigger('click');
    await flushPromises();

    expect(dryAeSdk.transferFunds).not.toHaveBeenCalled();
    expect(dryAeSdk.spend).toHaveBeenCalledTimes(1);
    const [[amount, recipientId, { onAccount, ...options }]] = dryAeSdk.spend.mock.calls;
    expect([amount, recipientId, onAccount.address]).toEqual(['2', RECIPIENT, cardAddress]);
    expect(options).toEqual({ denomination: AE_AMOUNT_FORMATS.AE });
    expect(mainButton().text()).toBe(en.common.ok);
    expect(wrapper.text()).toContain('2 AE');
  });

  it('redeems the full balance when the entered amount is the maximum', async () => {
    await mountClaimGiftCard();

    await wrapper.find('[data-cy=redeem-secondary-btn]').trigger('click');
    await wrapper.find('[data-cy=amount]').setValue(wrapper.vm.max.toString());
    await mainButton().trigger('click');
    await flushPromises();

    expect(dryAeSdk.spend).not.toHaveBeenCalled();
    expect(dryAeSdk.transferFunds).toHaveBeenCalledWith(1, RECIPIENT, expect.anything());
  });

  it('shows an empty gift card as redeemed already', async () => {
    getBalance.mockResolvedValue('0');
    await mountClaimGiftCard();

    expect(wrapper.text()).toContain(en.modals.claimGiftCard.alreadyRedeemed);
    expect(mainButton().text()).toBe(en.common.ok);

    await mainButton().trigger('click');

    expect(dryAeSdk.transferFunds).not.toHaveBeenCalled();
    expect(resolve).toHaveBeenCalledTimes(1);
  });
});
