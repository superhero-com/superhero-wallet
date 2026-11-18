// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import en from '@/popup/locales/en-US.json';

/**
 * The permission settings page and its modal twin, saving an edit while a dapp spends.
 * Runs the real forms, permissions and storage; fakes the balance, the rates, the router
 * and the validation rules, and stubs the inputs.
 */
vi.mock('@/composables/balances', () => ({ useBalances: () => ({ balance: ref(0) }) }));
vi.mock('@/composables/currencies', () => ({ useCurrencies: () => ({ marketData: ref({}) }) }));
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { host: 'aepp.example' }, meta: { isEdit: true } }),
  useRouter: () => ({ replace: vi.fn() }),
}));

const HOST = 'aepp.example';
const ITEM_KEY = 'sh-wallet_permissions';
const BtnMainStub = {
  props: ['text', 'disabled'],
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>',
};
const SlotsStub = { template: '<div><slot /><slot name="footer" /></div>' };

describe('editing a permission', () => {
  let storageListeners;

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    storageListeners = [];
    const addEventListener = window.addEventListener.bind(window);
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, ...rest) => {
      if (type === 'storage') storageListeners.push(listener);
      addEventListener(type, listener, ...rest);
    });
  });

  afterEach(() => {
    storageListeners.forEach((listener) => window.removeEventListener('storage', listener));
    vi.restoreAllMocks();
  });

  /** Mounted once the stored permission is restored, as the forms read it when they open. */
  async function mountForm(importForm) {
    // The instance the forms use, as modules were reset.
    const { defineRule } = await import('vee-validate');
    ['required', 'max_len', 'url', 'min_value_exclusive', 'does_not_exceed_decimals']
      .forEach((rule) => defineRule(rule, () => true));
    localStorage.setItem(ITEM_KEY, JSON.stringify({
      [HOST]: {
        host: HOST,
        name: 'Aepp',
        address: true,
        addressList: true,
        messageSign: false,
        dailySpendLimit: true,
        transactionSignLimit: 10,
        transactionSignSpent: 0,
        transactionSignFirstAskedOn: new Date().toISOString(),
      },
    }));
    await import('@/protocols/registerAdapters');
    const { default: Form } = await importForm();
    const { usePermissions } = await import('@/composables/permissions');
    await vi.waitFor(() => expect(usePermissions().permissions.value[HOST]).toBeDefined());

    const wrapper = mount(Form, {
      props: { host: HOST, resolve: vi.fn(), reject: vi.fn() },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
        stubs: {
          Modal: SlotsStub,
          PageWrapper: SlotsStub,
          BtnMain: BtnMainStub,
          InputField: true,
          InputAmount: true,
          TokenAmount: true,
          DetailsItem: true,
          SwitchButton: true,
        },
      },
    });
    await flushPromises();
    return wrapper;
  }

  function spendInOtherWindow(spent) {
    const registry = JSON.parse(localStorage.getItem(ITEM_KEY));
    registry[HOST].transactionSignSpent = spent;
    const newValue = JSON.stringify(registry);
    localStorage.setItem(ITEM_KEY, newValue);
    window.dispatchEvent(new StorageEvent('storage', {
      key: ITEM_KEY, newValue, storageArea: localStorage,
    }));
  }

  async function saveWithField(wrapper, fieldName, value) {
    wrapper.findAllComponents({ name: 'InputField' })
      .find((input) => input.attributes('name') === fieldName)
      .vm.$emit('update:modelValue', value);
    await flushPromises();
    await wrapper.findAll('button').find((button) => button.text() === en.common.confirm)
      .trigger('click');
    await flushPromises();
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    return JSON.parse(localStorage.getItem(ITEM_KEY));
  }

  const forms = [
    ['the settings page', () => import('@/popup/pages/PermissionManager.vue')],
    ['the modal', () => import('@/popup/components/Modals/PermissionManager.vue')],
  ];

  it.each(forms)('in %s keeps what a dapp spent since it opened', async (_, importForm) => {
    const wrapper = await mountForm(importForm);

    spendInOtherWindow(8);
    // Confirming needs a change.
    const stored = await saveWithField(wrapper, 'name', 'Renamed');

    expect(stored[HOST])
      .toMatchObject({ name: 'Renamed', transactionSignLimit: 10, transactionSignSpent: 8 });
  });

  it.each(forms)('in %s moves what a dapp spent to a renamed host', async (_, importForm) => {
    const wrapper = await mountForm(importForm);

    spendInOtherWindow(8);
    const stored = await saveWithField(wrapper, 'url', 'renamed.example');

    expect(stored[HOST]).toBeUndefined();
    expect(stored['renamed.example'])
      .toMatchObject({ host: 'renamed.example', transactionSignSpent: 8 });
  });
});
