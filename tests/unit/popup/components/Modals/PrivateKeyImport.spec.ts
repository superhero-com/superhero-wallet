// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';

import PrivateKeyImport from '@/popup/components/Modals/PrivateKeyImport.vue';
import { useAccounts, useModals } from '@/composables';
import { PROTOCOLS } from '@/constants';
import { ImportedAccountsUnreadableError } from '@/lib/errors';
import en from '@/popup/locales/en-US.json';

vi.mock('@/composables', () => ({
  useAccounts: vi.fn(),
  useModals: vi.fn(),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
// 32 bytes, well below the secp256k1 curve order - a valid Ethereum private key.
const PRIVATE_KEY_HEX = 'aa'.repeat(32);
const ModalStub = { template: '<div><slot /><slot name="footer" /></div>' };

async function submitPrivateKey(addPrivateKeyAccount) {
  const deps = {
    resolve: vi.fn(),
    setActiveAccountByGlobalIdx: vi.fn(),
    errorHandler: vi.fn(),
  };
  useAccounts.mockReturnValue({
    accounts: ref([]),
    addPrivateKeyAccount,
    setActiveAccountByGlobalIdx: deps.setActiveAccountByGlobalIdx,
  });
  useModals.mockReturnValue({ openModal: vi.fn() });

  const wrapper = mount(PrivateKeyImport, {
    global: {
      plugins: [i18n],
      stubs: { Modal: ModalStub },
      config: { errorHandler: deps.errorHandler },
    },
    props: { resolve: deps.resolve, protocol: PROTOCOLS.ethereum },
  });
  await wrapper.find('[data-cy=field-private-key] textarea').setValue(PRIVATE_KEY_HEX);
  await wrapper.find('[data-cy=btn-import]').trigger('click');
  await flushPromises();
  return { wrapper, ...deps };
}

describe('PrivateKeyImport', () => {
  it('activates the imported account and closes', async () => {
    const { resolve, setActiveAccountByGlobalIdx, errorHandler } = await submitPrivateKey(
      vi.fn().mockResolvedValue(3),
    );

    expect(setActiveAccountByGlobalIdx).toHaveBeenCalledWith(3);
    expect(resolve).toHaveBeenCalled();
    expect(errorHandler).not.toHaveBeenCalled();
  });

  it('stays open and ready to retry while the imported accounts are unreadable', async () => {
    const {
      wrapper, resolve, setActiveAccountByGlobalIdx, errorHandler,
    } = await submitPrivateKey(
      vi.fn().mockRejectedValue(new ImportedAccountsUnreadableError()),
    );

    expect(resolve).not.toHaveBeenCalled();
    expect(setActiveAccountByGlobalIdx).not.toHaveBeenCalled();
    expect(errorHandler).not.toHaveBeenCalled();
    expect(wrapper.find('[data-cy=btn-import]').attributes('aria-disabled')).toBeUndefined();
  });

  it('lets other import errors surface', async () => {
    const error = new Error('Storage failed');
    const { resolve, errorHandler } = await submitPrivateKey(vi.fn().mockRejectedValue(error));

    expect(resolve).not.toHaveBeenCalled();
    expect(errorHandler).toHaveBeenCalledWith(error, expect.anything(), expect.anything());
  });
});
