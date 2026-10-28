import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';

import AppsBrowserHeader from '@/popup/components/AppsBrowser/AppsBrowserHeader.vue';
import { PROTOCOLS } from '@/constants';
import en from '@/popup/locales/en-US.json';

const EVM_ADDRESS = '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4';
// The same key derives the same address on every EVM chain.
const accounts = [
  { protocol: PROTOCOLS.aeternity, address: 'ak_2swhLkgBPeeADxVTAVCJnZLY5NZtCFiM93JxsEaMuC59euuFRQ', globalIdx: 0 },
  { protocol: PROTOCOLS.ethereum, address: EVM_ADDRESS, globalIdx: 1 },
  { protocol: PROTOCOLS.bnb, address: EVM_ADDRESS, globalIdx: 2 },
];
const setActiveAccountByGlobalIdx = vi.fn();

vi.mock('@/composables', () => ({
  useUi: () => ({ homeRouteName: ref('account') }),
  useAccounts: () => ({
    isLoggedIn: ref(true),
    activeAccount: ref(accounts[1]),
    accountsSelectOptions: ref([]),
    setActiveAccountByGlobalIdx,
    getAccountByProtocolAndAddress: (protocol: string, address: string) => accounts
      .find((account) => account.protocol === protocol && account.address === address),
  }),
}));
vi.mock('@ionic/vue', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@ionic/vue')>()),
  useIonRouter: () => ({ navigate: vi.fn() }),
}));

const FormSelectStub = {
  name: 'FormSelect',
  props: ['modelValue', 'options'],
  template: '<div />',
};

describe('AppsBrowserHeader', () => {
  it('switches to the picked account of another protocol with the same address', async () => {
    const wrapper = mount(AppsBrowserHeader, {
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
        stubs: { FormSelect: FormSelectStub, Avatar: true, Truncate: true },
      },
    });

    await wrapper.findComponent(FormSelectStub).vm.$emit('update:modelValue', `${PROTOCOLS.bnb}:${EVM_ADDRESS}`);

    expect(setActiveAccountByGlobalIdx).toHaveBeenCalledWith(2);
  });
});
