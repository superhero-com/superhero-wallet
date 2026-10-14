import { METHODS } from '@aeternity/aepp-sdk';
import type { IAppData, IModalProps, IPermission } from '@/types';
import {
  MODAL_CONFIRM_CONNECT,
  MODAL_MESSAGE_SIGN,
  PERMISSION_DEFAULTS,
  STORAGE_KEYS,
} from '@/constants';
import { WalletStorage } from '@/lib/WalletStorage';

const HOST = 'dapp.example';
const dex: IPermission = {
  ...PERMISSION_DEFAULTS, host: 'aepp.dex.superhero.com', name: 'DEX', address: true,
};
const openModalMock = vi.fn();

async function loadPermissions() {
  vi.resetModules();
  const { usePermissions } = await import('@/composables/permissions');
  return usePermissions();
}

describe('usePermissions - dapp host', () => {
  beforeEach(() => {
    localStorage.clear();
    openModalMock.mockReset().mockResolvedValue({});
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({ openModal: openModalMock }),
    }));
  });

  afterEach(() => {
    vi.doUnmock('@/composables/modals');
  });

  it('drops a permission saved under an empty host when restoring', async () => {
    WalletStorage.set(STORAGE_KEYS.permissions, {
      '': { ...PERMISSION_DEFAULTS, name: 'app.uniswap.org', address: true },
      [dex.host]: dex,
    });
    const { permissions } = await loadPermissions();

    await vi.waitFor(() => expect(permissions.value).toEqual({ [dex.host]: dex }));
    expect(WalletStorage.get(STORAGE_KEYS.permissions)).toEqual({ [dex.host]: dex });
  });

  it('does not save a permission under an empty host', async () => {
    const { addPermission, permissions } = await loadPermissions();
    addPermission({ ...PERMISSION_DEFAULTS, address: true });

    expect(permissions.value).toEqual({});
  });

  describe('app passed to the connect modal', () => {
    async function askToConnect(modalProps: IModalProps) {
      const { checkOrAskPermission } = await loadPermissions();
      await checkOrAskPermission(METHODS.subscribeAddress, `https://${HOST}/path?q=1`, modalProps);

      expect(openModalMock).toHaveBeenCalledOnce();
      expect(openModalMock).toHaveBeenCalledWith(MODAL_CONFIRM_CONNECT, expect.anything());
      return openModalMock.mock.calls[0][1].app;
    }

    it('builds the app from the request URL, not from the caller', async () => {
      const app = await askToConnect({
        app: { host: 'aescan.io', href: 'https://aescan.io/', name: 'aeScan' },
      });
      expect(app).toStrictEqual({
        host: HOST,
        name: HOST,
        protocol: 'https:',
        href: `https://${HOST}/path?q=1`,
      });
    });

    it('keeps the origin source given by the caller', async () => {
      const app = await askToConnect({
        app: { host: 'aescan.io', originSource: 'self-reported' },
      });
      expect(app).toMatchObject({ host: HOST, originSource: 'self-reported' });
    });
  });

  describe('message signing for a host with a standing permission', () => {
    beforeEach(() => {
      vi.doMock('@/composables/accounts', () => ({
        useAccounts: () => ({ activeAccount: { value: { address: '0x1' } } }),
      }));
    });

    afterEach(() => {
      vi.doUnmock('@/composables/accounts');
    });

    async function askToSignMessage(app?: IAppData) {
      const { addPermission, checkOrAskPermission } = await loadPermissions();
      addPermission({
        ...PERMISSION_DEFAULTS, host: HOST, name: HOST, messageSign: true,
      });
      return checkOrAskPermission(METHODS.signMessage, `https://${HOST}/`, { app });
    }

    it('signs without asking the host itself', async () => {
      expect(await askToSignMessage()).toBe(true);
      expect(openModalMock).not.toHaveBeenCalled();
    });

    it('asks a dapp that only claims the host', async () => {
      await askToSignMessage({ host: HOST, originSource: 'self-reported' });
      expect(openModalMock).toHaveBeenCalledWith(MODAL_MESSAGE_SIGN, expect.anything());
    });
  });
});
