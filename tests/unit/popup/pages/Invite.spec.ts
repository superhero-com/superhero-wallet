// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import BigNumber from 'bignumber.js';
import { InvalidTxError, TxTimedOutError } from '@aeternity/aepp-sdk';
import en from '@/popup/locales/en-US.json';

/**
 * Generating an invite moves funds to a fresh account whose key exists only in the
 * wallet's storage. Runs the real `useInvites` and storage; mocks only the SDK, modals
 * and the balance/UI state the page reads.
 */
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
const TX_HASH = 'th_2Lzq4y5a9xX9dKz7mq2pKyGJbYsdTkRaZyWNd5x3qAyCXdM5BP';

const InputAmountStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input data-cy="amount" @input="$emit(\'update:modelValue\', $event.target.value)" />',
};
const BtnMainStub = {
  props: ['disabled'],
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')" />',
};
const InviteItemStub = {
  props: ['secretKey', 'createdAt'],
  template: '<div data-cy="invite-item" />',
};

describe('Invite page', () => {
  let spend;
  let openDefaultModal;
  let errorHandler;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();

    spend = vi.fn().mockResolvedValue({ hash: TX_HASH });
    openDefaultModal = vi.fn().mockResolvedValue(undefined);
    errorHandler = vi.fn();

    // Registered before the composables barrel is reloaded below.
    const mockComposable = (path, mocks) => vi.doMock(path, () => mocks);
    mockComposable('@/composables/aeSdk', {
      useAeSdk: () => ({ getAeSdk: async () => ({ spend }) }),
    });
    mockComposable('@/composables/modals', { useModals: () => ({ openDefaultModal }) });
    mockComposable('@/composables/accounts', {
      useAccounts: () => ({ activeAccount: ref({ protocol: 'aeternity' }) }),
    });
    mockComposable('@/composables/balances', {
      useBalances: () => ({ balance: ref(new BigNumber(10)) }),
    });
    mockComposable('@/composables/currencies', { useCurrencies: () => ({ marketData: ref({}) }) });
    mockComposable('@/composables/maxAmount', {
      useMaxAmount: () => ({ max: ref('9'), fee: ref(new BigNumber('0.00002')) }),
    });
    mockComposable('@/composables/ui', { useUi: () => ({ setLoaderVisible: vi.fn() }) });
    await import('@/protocols/registerAdapters');

    // Registered by the app's vee-validate plugin, which isn't under test here.
    const { defineRule } = await import('vee-validate');
    ['does_not_exceed_decimals', 'min_value_exclusive', 'max_value', 'enough_coin']
      .forEach((rule) => defineRule(rule, () => true));
  });

  async function generateInvite() {
    const { default: Invite } = await import('@/popup/pages/Invite.vue');
    const wrapper = mount(Invite, {
      global: {
        plugins: [i18n],
        config: { errorHandler },
        stubs: {
          PageWrapper: { template: '<div><slot /></div>' },
          AccountInfo: true,
          BalanceInfo: true,
          InputAmount: InputAmountStub,
          BtnMain: BtnMainStub,
          InviteItem: InviteItemStub,
        },
      },
    });
    await wrapper.find('[data-cy=amount]').setValue('1');
    await flushPromises();
    await wrapper.find('[data-cy=invite-generate]').trigger('click');
    await flushPromises();
    return wrapper;
  }

  async function getStoredInviteAddresses() {
    const { WalletStorage } = await import('@/lib/WalletStorage');
    const { STORAGE_KEYS } = await import('@/constants');
    const { getAccountFromSecret } = await import('@/protocols/aeternity/helpers');
    return (WalletStorage.get(STORAGE_KEYS.invites) || [])
      .map(({ secretKey }) => getAccountFromSecret(Buffer.from(secretKey.data)).address);
  }

  async function getShownInviteAddresses(wrapper) {
    const { getAccountFromSecret } = await import('@/protocols/aeternity/helpers');
    return wrapper.findAllComponents(InviteItemStub)
      .map((item) => getAccountFromSecret(item.props('secretKey')).address);
  }

  it('stores the key of the funded invite account before the funds are sent', async () => {
    let storedAddressesWhenSent;
    spend.mockImplementation(async () => {
      await flushPromises();
      storedAddressesWhenSent = await getStoredInviteAddresses();
      return { hash: TX_HASH };
    });

    const wrapper = await generateInvite();

    const [[amount, fundedAddress]] = spend.mock.calls;
    expect(amount).toBe('1');
    expect(storedAddressesWhenSent).toEqual([fundedAddress]);
    expect(await getStoredInviteAddresses()).toEqual([fundedAddress]);
    expect(await getShownInviteAddresses(wrapper)).toEqual([fundedAddress]);
    expect(errorHandler).not.toHaveBeenCalled();
  });

  it.each([
    ['sending it fails', () => spend.mockRejectedValue(new Error('Network Error'))],
    ['waiting for it to be mined fails', () => spend
      .mockRejectedValue(new TxTimedOutError(5, TX_HASH))],
  ])('keeps the invite when %s, as the funds may have been sent', async (_, failTransfer) => {
    failTransfer();

    const wrapper = await generateInvite();

    const [[, fundedAddress]] = spend.mock.calls;
    expect(await getStoredInviteAddresses()).toEqual([fundedAddress]);
    expect(await getShownInviteAddresses(wrapper)).toEqual([fundedAddress]);
    expect(errorHandler).toHaveBeenCalledTimes(1);
  });

  it('drops the invite when the transfer is rejected before it is sent', async () => {
    const message = 'Account balance 1 is not enough to execute the transaction that costs 2';
    spend.mockRejectedValue(new InvalidTxError(
      `Transaction verification errors: ${message}`,
      [{ message, key: 'InsufficientBalance', checkedKeys: ['amount'] }],
      'tx_',
    ));

    const wrapper = await generateInvite();

    expect(await getStoredInviteAddresses()).toEqual([]);
    expect(wrapper.findAllComponents(InviteItemStub)).toHaveLength(0);
    expect(openDefaultModal).toHaveBeenCalledWith({ msg: en.pages.invite['insufficient-balance'] });
    expect(errorHandler).not.toHaveBeenCalled();
  });

  it('shows the new invite once its funds have arrived', async () => {
    let markMined;
    spend.mockReturnValue(new Promise((resolve) => { markMined = resolve; }));

    const wrapper = await generateInvite();

    const [[, fundedAddress]] = spend.mock.calls;
    expect(await getStoredInviteAddresses()).toEqual([fundedAddress]);
    expect(wrapper.findAllComponents(InviteItemStub)).toHaveLength(0);

    markMined({ hash: TX_HASH });
    await flushPromises();

    expect(await getShownInviteAddresses(wrapper)).toEqual([fundedAddress]);
  });
});
