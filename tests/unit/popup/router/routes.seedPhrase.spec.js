import { ref } from 'vue';
import { routes } from '../../../../src/popup/router/routes';
import {
  ROUTE_SEED_PHRASE_DETAILS,
  ROUTE_SEED_PHRASE_VERIFY,
} from '../../../../src/popup/router/routeNames';

const mockOpenConfirmModal = vi.fn();
const mockOpenPasswordLoginModal = vi.fn();
const mockOpenBiometricLoginModal = vi.fn();
const mockCanAuthenticateWithDevice = vi.fn();
const mockIsUsingDefaultPassword = ref(false);
const mockIsBiometricLoginEnabled = ref(false);
const platform = vi.hoisted(() => ({ isMobileApp: false }));

vi.mock('@/constants', async (importOriginal) => ({
  ...(await importOriginal()),
  get IS_MOBILE_APP() { return platform.isMobileApp; },
}));

vi.mock('@/composables', () => ({
  useAuth: () => ({
    isUsingDefaultPassword: mockIsUsingDefaultPassword,
    canAuthenticateWithDevice: mockCanAuthenticateWithDevice,
  }),
  useModals: () => ({
    openConfirmModal: mockOpenConfirmModal,
    openPasswordLoginModal: mockOpenPasswordLoginModal,
    openBiometricLoginModal: mockOpenBiometricLoginModal,
  }),
  useUi: () => ({
    isBiometricLoginEnabled: mockIsBiometricLoginEnabled,
  }),
  useWalletConnect: vi.fn(),
}));

vi.mock('@/popup/plugins/i18n', () => ({
  tg: (key) => key,
}));

describe('seed phrase reveal routes', () => {
  beforeEach(() => {
    mockOpenConfirmModal.mockReset();
    mockOpenPasswordLoginModal.mockReset();
    mockOpenBiometricLoginModal.mockReset();
    mockCanAuthenticateWithDevice.mockReset();
    mockIsUsingDefaultPassword.value = false;
    mockIsBiometricLoginEnabled.value = false;
    platform.isMobileApp = false;
  });

  it('verifies the user on the device on mobile when it can', async () => {
    platform.isMobileApp = true;
    mockIsBiometricLoginEnabled.value = true;
    mockCanAuthenticateWithDevice.mockResolvedValue(true);
    const next = vi.fn();
    const route = routes.find(({ name }) => name === ROUTE_SEED_PHRASE_DETAILS);

    await route.beforeEnter({}, {}, next);

    expect(mockOpenBiometricLoginModal).toHaveBeenCalledWith({ force: true });
    expect(mockOpenConfirmModal).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('does not show it on mobile when the device check fails', async () => {
    platform.isMobileApp = true;
    mockIsBiometricLoginEnabled.value = true;
    mockCanAuthenticateWithDevice.mockResolvedValue(true);
    mockOpenBiometricLoginModal.mockRejectedValue(new Error('noDeviceCredential'));
    const next = vi.fn();
    const route = routes.find(({ name }) => name === ROUTE_SEED_PHRASE_DETAILS);

    await route.beforeEnter({}, { matched: [{}] }, next);

    expect(mockOpenConfirmModal).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(false);
  });

  it('asks to confirm on mobile when the device can verify the user in no way', async () => {
    platform.isMobileApp = true;
    mockIsBiometricLoginEnabled.value = true;
    mockCanAuthenticateWithDevice.mockResolvedValue(false);
    const next = vi.fn();
    const route = routes.find(({ name }) => name === ROUTE_SEED_PHRASE_DETAILS);

    await route.beforeEnter({}, {}, next);

    expect(mockOpenConfirmModal).toHaveBeenCalledTimes(1);
    expect(mockOpenBiometricLoginModal).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  [ROUTE_SEED_PHRASE_DETAILS, ROUTE_SEED_PHRASE_VERIFY].forEach((routeName) => {
    it(`requires password re-auth on ${routeName} for password-protected web installs`, async () => {
      const next = vi.fn();
      const route = routes.find(({ name }) => name === routeName);

      await route.beforeEnter({}, {}, next);

      expect(mockOpenPasswordLoginModal).toHaveBeenCalledTimes(1);
      expect(mockOpenConfirmModal).not.toHaveBeenCalled();
      expect(mockOpenBiometricLoginModal).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });
  });
});
