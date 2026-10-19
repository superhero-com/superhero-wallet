// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { defineRule } from 'vee-validate';
import en from '@/popup/locales/en-US.json';

/**
 * A name already queued for the account is not registered again: its preclaim holds the salt the
 * claim needs, from the moment the node accepted it.
 */
const mocks = vi.hoisted(() => ({
  addNameToClaimQueue: vi.fn(),
  getAeSdk: vi.fn(),
  openDefaultModal: vi.fn(),
  preclaimedNames: { value: {} },
}));

vi.mock('@/composables', async () => {
  const { ref: mockRef } = await import('vue');
  return {
    useAccounts: () => ({ activeAccount: mockRef({ address: 'ak_test' }) }),
    useModals: () => ({ openDefaultModal: mocks.openDefaultModal, openModal: vi.fn() }),
    useAeSdk: () => ({ getAeSdk: mocks.getAeSdk, nodeNetworkId: mockRef('ae_uat') }),
    useUi: () => ({
      isLoaderVisible: mockRef(false),
      isNameClaimInfoModalHidden: mockRef(true),
      setLoaderVisible: vi.fn(),
      setNameClaimInfoModalHidden: vi.fn(),
    }),
  };
});
vi.mock('@/protocols/aeternity/composables/aeNames', () => ({
  NAME_CLAIM_STATUS: {
    preclaimSubmitted: 'preclaim-submitted',
    preclaimed: 'preclaimed',
    claimSubmitted: 'claim-submitted',
    pointerUpdatePending: 'pointer-update-pending',
    claimed: 'claimed',
  },
  useAeNames: () => ({
    addNameToClaimQueue: mocks.addNameToClaimQueue,
    preclaimedNames: mocks.preclaimedNames,
  }),
}));
vi.mock('@ionic/vue', async (importOriginal) => ({
  ...(await importOriginal()),
  onIonViewWillEnter: vi.fn(),
}));
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => ({ push: vi.fn() }),
}));

// Registered by `veeValidate.ts`, which the page doesn't load by itself
['required', 'aens_name', 'aens_name_unregistered', 'max_len', 'enough_coin']
  .forEach((rule) => defineRule(rule, () => true));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

const InputFieldStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input data-cy="name" @input="$emit(\'update:modelValue\', $event.target.value)" />',
};
const BtnMainStub = {
  emits: ['click'],
  template: '<button data-cy="register" @click="$emit(\'click\')"><slot /></button>',
};

describe('Claim', () => {
  beforeEach(() => {
    mocks.addNameToClaimQueue.mockReset();
    mocks.getAeSdk.mockReset();
    mocks.openDefaultModal.mockReset();
  });

  it.each(['preclaim-submitted', 'preclaimed'])(
    'does not register a name again while its preclaim is %s',
    async (status) => {
      mocks.preclaimedNames.value = {
        ae_uat: { 'testname.chain': { address: 'ak_test', name: 'testname.chain', status } },
      };
      const { default: Claim } = await import('@/popup/pages/Names/Claim.vue');
      const wrapper = mount(Claim, {
        global: {
          plugins: [i18n],
          stubs: {
            IonPage: { template: '<div><slot /></div>' },
            IonContent: { template: '<div><slot /></div>' },
            InputField: InputFieldStub,
            CheckBox: true,
            BtnHelp: true,
            BtnMain: BtnMainStub,
          },
        },
      });

      await wrapper.find('[data-cy=name]').setValue('testname');
      await wrapper.find('[data-cy=register]').trigger('click');
      await flushPromises();

      expect(mocks.openDefaultModal).toHaveBeenCalledWith(expect.objectContaining({
        msg: en.modals['name-already-preclaimed'].msg,
      }));
      expect(mocks.getAeSdk).not.toHaveBeenCalled();
      expect(mocks.addNameToClaimQueue).not.toHaveBeenCalled();
    },
  );
});
