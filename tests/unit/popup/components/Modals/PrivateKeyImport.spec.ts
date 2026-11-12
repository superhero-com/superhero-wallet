// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';

import PrivateKeyImport from '@/popup/components/Modals/PrivateKeyImport.vue';
import { useAccounts, useModals } from '@/composables';
import { ACCOUNT_TYPES, PROTOCOLS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
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

async function submitPrivateKey(addPrivateKeyAccount, accounts = ref([])) {
  const deps = {
    resolve: vi.fn(),
    setActiveAccountByGlobalIdx: vi.fn(),
    errorHandler: vi.fn(),
    openDefaultModal: vi.fn(),
  };
  useAccounts.mockReturnValue({
    accounts,
    addPrivateKeyAccount,
    setActiveAccountByGlobalIdx: deps.setActiveAccountByGlobalIdx,
  });
  useModals.mockReturnValue({ openModal: vi.fn(), openDefaultModal: deps.openDefaultModal });

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

  it('says the account was not saved when storing it fails', async () => {
    const error = new Error('Storage failed');
    const { resolve, errorHandler, openDefaultModal } = await submitPrivateKey(
      vi.fn().mockRejectedValue(error),
    );

    expect(resolve).not.toHaveBeenCalled();
    expect(openDefaultModal).toHaveBeenCalledWith(expect.objectContaining({
      msg: en.modals.privateKeyImport.saveFailed,
    }));
    expect(errorHandler).toHaveBeenCalledWith(error, expect.anything(), expect.anything());
  });

  it('says the account stays until the wallet closes when only the device storage failed', async () => {
    const accounts = ref([]);
    const { secretKey } = ProtocolAdapterFactory.getAdapter(PROTOCOLS.ethereum).resolveAccountRaw({
      type: ACCOUNT_TYPES.privateKey,
      isRestored: false,
      protocol: PROTOCOLS.ethereum,
      privateKey: Buffer.from(PRIVATE_KEY_HEX, 'hex'),
    }, 0, 0);
    const { openDefaultModal } = await submitPrivateKey(vi.fn(async () => {
      // As on mobile: in the view, but its native write failed.
      accounts.value = [{ protocol: PROTOCOLS.ethereum, secretKey }];
      throw new Error('Keychain write failed');
    }), accounts);

    expect(openDefaultModal).toHaveBeenCalledWith(expect.objectContaining({
      msg: en.modals.privateKeyImport.saveFailedUntilClosed,
    }));
  });

  it('imports once when submitted again before the first import is stored', async () => {
    let finishImport;
    const addPrivateKeyAccount = vi.fn(() => new Promise((resolve) => { finishImport = resolve; }));
    const { wrapper, resolve } = await submitPrivateKey(addPrivateKeyAccount);
    const button = wrapper.find('[data-cy=btn-import]');

    expect(button.attributes('aria-disabled')).toBeDefined();
    await button.trigger('click');
    await wrapper.find('[data-cy=field-private-key] textarea').trigger('keydown.enter');
    await flushPromises();
    expect(addPrivateKeyAccount).toHaveBeenCalledTimes(1);

    finishImport(1);
    await flushPromises();
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(button.attributes('aria-disabled')).toBeUndefined();
  });
});
