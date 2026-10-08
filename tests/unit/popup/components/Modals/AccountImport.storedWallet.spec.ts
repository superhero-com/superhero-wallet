// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';

import AccountImport from '@/popup/components/Modals/AccountImport.vue';
import {
  useAccounts,
  useAuth,
  useModals,
  useUi,
} from '@/composables';
import { StoredWalletFoundError } from '@/lib/errors';
import en from '@/popup/locales/en-US.json';

vi.mock('@/composables', () => ({
  useAccounts: vi.fn(),
  useAuth: vi.fn(),
  useModals: vi.fn(),
  useUi: vi.fn(),
}));
const routerPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
const SEED = 'media view gym mystery all fault truck target envelope kit drop fade';
/** The button, the backdrop and the hardware back button all close the real one the same way. */
const ModalStub = {
  props: ['hasCloseButton'],
  emits: ['close'],
  template: `
    <div>
      <button v-if="hasCloseButton" data-cy="close" @click="$emit('close')" />
      <slot /><slot name="footer" />
    </div>
  `,
};

async function importSeed({
  setMnemonicAndInitializeAuthentication = vi.fn().mockResolvedValue(undefined),
  discoverAccounts = vi.fn().mockResolvedValue(true),
} = {}) {
  const deps = {
    discoverAccounts,
    resolve: vi.fn(),
    setBackedUpSeed: vi.fn(),
  };
  useAccounts.mockReturnValue({ discoverAccounts: deps.discoverAccounts });
  useAuth.mockReturnValue({ setMnemonicAndInitializeAuthentication });
  useModals.mockReturnValue({ openScanQrModal: vi.fn() });
  useUi.mockReturnValue({
    loginTargetLocation: ref({ name: 'account' }),
    setBackedUpSeed: deps.setBackedUpSeed,
  });

  const wrapper = mount(AccountImport, {
    global: {
      plugins: [i18n],
      stubs: { Modal: ModalStub },
    },
    props: { resolve: deps.resolve, reject: vi.fn() },
  });
  await wrapper.find('[data-cy=field-mnemonic] textarea').setValue(SEED);
  await wrapper.find('[data-cy=btn-import]').trigger('click');
  await flushPromises();
  return { wrapper, ...deps };
}

beforeEach(() => {
  routerPush.mockClear();
});

describe('AccountImport when a wallet that failed to load is stored', () => {
  it('closes without importing or reporting an error', async () => {
    const {
      wrapper, discoverAccounts, resolve, setBackedUpSeed,
    } = await importSeed({
      setMnemonicAndInitializeAuthentication: vi.fn()
        .mockRejectedValue(new StoredWalletFoundError()),
    });

    expect(resolve).toHaveBeenCalled();
    expect(discoverAccounts).not.toHaveBeenCalled();
    expect(setBackedUpSeed).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain(en.pages.index.passwordWasNotSet);
  });

  it('still reports other failures in place', async () => {
    const { wrapper, resolve } = await importSeed({
      setMnemonicAndInitializeAuthentication: vi.fn().mockRejectedValue(new Error('cancelled')),
    });

    expect(resolve).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(en.pages.index.passwordWasNotSet);
    expect(wrapper.find('[data-cy=close]').exists()).toBe(true);
  });
});

describe('AccountImport while restoring the accounts of the imported seed', () => {
  it('cannot be closed, so the start page cannot create a wallet over the seed meanwhile', async () => {
    let finishDiscovery;
    const { wrapper, resolve } = await importSeed({
      discoverAccounts: vi.fn(() => new Promise((finish) => { finishDiscovery = finish; })),
    });

    expect(wrapper.find('[data-cy=close]').exists()).toBe(false);
    wrapper.findComponent(ModalStub).vm.$emit('close'); // Backdrop or hardware back button.
    await flushPromises();
    expect(resolve).not.toHaveBeenCalled();

    finishDiscovery(true);
    await flushPromises();
    expect(resolve).toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith({ name: 'account' });
  });
});
