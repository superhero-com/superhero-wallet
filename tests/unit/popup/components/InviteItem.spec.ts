// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import BigNumber from 'bignumber.js';
import { AE_AMOUNT_FORMATS } from '@aeternity/aepp-sdk';
import en from '@/popup/locales/en-US.json';

/**
 * The invite key is the only access to the funds sent to it. Its balance is read on the
 * current network and an error reads as 0, so the Delete button can't be trusted alone.
 */
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
const SECRET_KEY = Buffer.from('a'.repeat(64), 'hex');

const InputAmountStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input data-cy="amount" @input="$emit(\'update:modelValue\', $event.target.value)" />',
};
const BtnMainStub = {
  props: ['disabled', 'text'],
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>',
};

describe('InviteItem', () => {
  let getBalance;
  let spend;
  let openConfirmModal;
  let removeInvite;
  let errorHandler;

  beforeEach(async () => {
    vi.resetModules();

    getBalance = vi.fn().mockRejectedValue(new Error('Network Error'));
    spend = vi.fn().mockResolvedValue({ hash: 'th_' });
    openConfirmModal = vi.fn();
    removeInvite = vi.fn().mockResolvedValue(undefined);
    errorHandler = vi.fn();

    const mockComposable = (path, mocks) => vi.doMock(path, () => mocks);
    mockComposable('@/composables/aeSdk', {
      useAeSdk: () => ({ getAeSdk: async () => ({ getBalance, spend }) }),
    });
    mockComposable('@/composables/modals', {
      useModals: () => ({ openConfirmModal, openDefaultModal: vi.fn() }),
    });
    mockComposable('@/composables/invites', {
      useInvites: () => ({
        claimInvite: vi.fn(),
        removeInvite,
        handleInsufficientBalanceError: vi.fn().mockResolvedValue(false),
      }),
    });
    mockComposable('@/composables/accounts', {
      useAccounts: () => ({ getLastActiveProtocolAccount: () => ({ address: 'ak_recipient' }) }),
    });
    mockComposable('@/composables/balances', {
      useBalances: () => ({ balance: ref(new BigNumber(10)) }),
    });
    mockComposable('@/composables/currencies', { useCurrencies: () => ({ marketData: ref({}) }) });
    mockComposable('@/composables/maxAmount', { useMaxAmount: () => ({ max: ref('9') }) });
    vi.doMock('vue-router', async (importOriginal) => ({
      ...(await importOriginal()),
      useRouter: () => ({ resolve: () => ({ href: '#/invite-claim' }) }),
    }));
    await import('@/protocols/registerAdapters');

    // Registered by the app's vee-validate plugin, which isn't under test here.
    const { defineRule } = await import('vee-validate');
    ['required', 'does_not_exceed_decimals', 'max_value']
      .forEach((rule) => defineRule(rule, () => true));
  });

  async function mountInviteItem() {
    const { default: InviteItem } = await import('@/popup/components/InviteItem.vue');
    const wrapper = mount(InviteItem, {
      props: { secretKey: SECRET_KEY, createdAt: 0 },
      global: {
        plugins: [i18n],
        config: { errorHandler },
        stubs: {
          TokenAmount: true,
          CopyText: true,
          InputAmount: InputAmountStub,
          BtnMain: BtnMainStub,
        },
      },
    });
    await flushPromises();
    return wrapper;
  }

  it('deletes the invite only after the deletion is confirmed', async () => {
    let confirm;
    openConfirmModal.mockReturnValue(new Promise((resolve) => { confirm = resolve; }));
    const wrapper = await mountInviteItem();

    await wrapper.find('[data-cy=invite-delete]').trigger('click');

    expect(openConfirmModal).toHaveBeenCalledWith({
      icon: 'warning',
      title: en.pages.invite['delete-confirm-title'],
      msg: en.pages.invite['delete-confirm-msg'],
    });
    expect(removeInvite).not.toHaveBeenCalled();

    confirm();
    await flushPromises();

    expect(removeInvite).toHaveBeenCalledWith(SECRET_KEY);
    expect(errorHandler).not.toHaveBeenCalled();
  });

  it('keeps the invite when the deletion is cancelled', async () => {
    const { RejectedByUserError } = await import('@/lib/errors');
    openConfirmModal.mockRejectedValue(new RejectedByUserError());
    const wrapper = await mountInviteItem();

    await wrapper.find('[data-cy=invite-delete]').trigger('click');
    await flushPromises();

    expect(openConfirmModal).toHaveBeenCalled();
    expect(removeInvite).not.toHaveBeenCalled();
    expect(errorHandler).not.toHaveBeenCalled();
  });

  it('offers claiming back instead of deleting an invite with funds', async () => {
    getBalance.mockResolvedValue('0.5');
    const wrapper = await mountInviteItem();

    expect(wrapper.find('[data-cy=invite-delete]').exists()).toBe(false);
    expect(wrapper.find('[data-cy=invite-claim]').exists()).toBe(true);
  });

  it('tops up the invite account with the entered amount of AE', async () => {
    const { getAccountFromSecret } = await import('@/protocols/aeternity/helpers');
    getBalance.mockResolvedValue('0');
    const wrapper = await mountInviteItem();

    await wrapper.find('[data-cy=invite-top-up]').trigger('click');
    await wrapper.find('[data-cy=amount]').setValue('2.5');
    await flushPromises();
    await wrapper.find('[data-cy=send-top-up]').trigger('click');
    await flushPromises();

    expect(spend).toHaveBeenCalledTimes(1);
    expect(spend).toHaveBeenCalledWith(
      '2.5',
      getAccountFromSecret(SECRET_KEY).address,
      { denomination: AE_AMOUNT_FORMATS.AE },
    );
    expect(errorHandler).not.toHaveBeenCalled();
  });
});
