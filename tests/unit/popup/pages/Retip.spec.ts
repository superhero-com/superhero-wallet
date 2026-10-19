// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import BigNumber from 'bignumber.js';
import en from '@/popup/locales/en-US.json';

/**
 * A retip sends the amount typed on the page to the tipping contract. Runs the real
 * page; mocks the tipping contracts (where the call is signed) and the balance, tip
 * and UI state the page reads.
 */
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
const ACCOUNT = { protocol: 'aeternity', address: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR' };

const InputAmountStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input data-cy="amount" @input="$emit(\'update:modelValue\', $event.target.value)" />',
};
const BtnMainStub = {
  props: ['disabled', 'text'],
  emits: ['click'],
  template: '<button :data-cy="text" :disabled="disabled" @click="$emit(\'click\')" />',
};

describe('Retip page', () => {
  let retip;
  let warnings;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();

    retip = vi.fn().mockResolvedValue({ hash: 'th_retip' });
    warnings = [];

    // Registered before the composables barrel is reloaded below.
    const mockComposable = (path, mocks) => vi.doMock(path, () => mocks);
    mockComposable('vue-router', { useRoute: () => ({ query: { id: '1_v1' } }) });
    mockComposable('@/composables/tippingContracts', {
      useTippingContracts: () => ({
        getTippingContracts: async () => ({
          tippingV1: { retip, $options: { address: 'ct_tipping' } },
        }),
      }),
    });
    mockComposable('@/protocols/aeternity/composables/aeTippingBackend', {
      useAeTippingBackend: () => ({
        getCacheTip: async () => ({ id: '1_v1', url: 'https://example.com' }),
      }),
    });
    mockComposable('@/protocols/aeternity/composables/aeTippingUrls', {
      useAeTippingUrls: () => ({ getTippingUrlStatus: () => undefined }),
    });
    mockComposable('@/composables/aeSdk', { useAeSdk: () => ({ isTippingSupported: ref(true) }) });
    mockComposable('@/composables/accounts', {
      useAccounts: () => ({ getLastActiveProtocolAccount: () => ACCOUNT }),
    });
    mockComposable('@/composables/balances', {
      useBalances: () => ({ balance: ref(new BigNumber(100000)) }),
    });
    mockComposable('@/composables/currencies', { useCurrencies: () => ({ marketData: ref({}) }) });
    mockComposable('@/composables/maxAmount', {
      useMaxAmount: () => ({ max: ref('99999'), fee: ref(new BigNumber('0.00002')) }),
    });
    mockComposable('@/composables/latestTransactionList', {
      useLatestTransactionList: () => ({ addAccountPendingTransaction: vi.fn() }),
    });
    mockComposable('@/composables/deepLinkApi', {
      useDeepLinkApi: () => ({ openCallbackOrGoHome: vi.fn() }),
    });
    mockComposable('@/composables/fungibleTokens', {
      useFungibleTokens: () => ({ createOrChangeAllowance: vi.fn() }),
    });
    mockComposable('@/composables/ui', { useUi: () => ({ setLoaderVisible: vi.fn() }) });
    await import('@/protocols/registerAdapters');

    // Registered by the app's vee-validate plugin, which isn't under test here.
    const { defineRule } = await import('vee-validate');
    [
      'required', 'min_value_exclusive', 'does_not_exceed_decimals',
      'ae_min_tip_amount', 'max_value', 'enough_coin',
    ].forEach((rule) => defineRule(rule, () => true));
  });

  async function retipAmount(amount) {
    const { default: Retip } = await import('@/popup/pages/Retip.vue');
    const wrapper = mount(Retip, {
      global: {
        plugins: [i18n],
        config: { warnHandler: (msg) => warnings.push(msg) },
        stubs: {
          PageWrapper: { template: '<div><slot /></div>' },
          BalanceInfo: true,
          UrlStatus: true,
          InputAmount: InputAmountStub,
          BtnMain: BtnMainStub,
        },
      },
    });
    await flushPromises();
    await wrapper.find('[data-cy=amount]').setValue(amount);
    await flushPromises();
    await wrapper.find(`[data-cy="${en.common.confirm}"]`).trigger('click');
    await flushPromises();
  }

  it('retips every digit of an 18-decimal AE amount', async () => {
    await retipAmount('1.499825123456789123');

    expect(retip).toHaveBeenCalledWith(1, { amount: '1499825123456789123', waitMined: false });
    // Retip.vue's own `useFieldError()` runs outside any field; unrelated to the amount.
    expect(warnings.filter((msg) => !msg.includes('vee-validate-field-instance'))).toEqual([]);
  });
});
