import { ref } from 'vue';
import { routes } from '../../../../src/popup/router/routes';
import {
  ROUTE_SEED_PHRASE_DETAILS,
  ROUTE_SEED_PHRASE_VERIFY,
} from '../../../../src/popup/router/routeNames';

const mockOpenConfirmModal = jest.fn();
const mockOpenPasswordLoginModal = jest.fn();
const mockOpenBiometricLoginModal = jest.fn();
const mockCheckBiometricLoginAvailability = jest.fn();
const mockIsUsingDefaultPassword = ref(false);
const mockIsBiometricLoginEnabled = ref(false);

jest.mock('@/composables', () => ({
  useAuth: () => ({
    isUsingDefaultPassword: mockIsUsingDefaultPassword,
    checkBiometricLoginAvailability: mockCheckBiometricLoginAvailability,
  }),
  useModals: () => ({
    openConfirmModal: mockOpenConfirmModal,
    openPasswordLoginModal: mockOpenPasswordLoginModal,
    openBiometricLoginModal: mockOpenBiometricLoginModal,
  }),
  useUi: () => ({
    isBiometricLoginEnabled: mockIsBiometricLoginEnabled,
  }),
  useWalletConnect: jest.fn(),
}));

jest.mock('@/popup/plugins/i18n', () => ({
  tg: (key) => key,
}));

describe('seed phrase reveal routes', () => {
  beforeEach(() => {
    mockOpenConfirmModal.mockReset();
    mockOpenPasswordLoginModal.mockReset();
    mockOpenBiometricLoginModal.mockReset();
    mockCheckBiometricLoginAvailability.mockReset();
    mockIsUsingDefaultPassword.value = false;
    mockIsBiometricLoginEnabled.value = false;
  });

  [ROUTE_SEED_PHRASE_DETAILS, ROUTE_SEED_PHRASE_VERIFY].forEach((routeName) => {
    it(`requires password re-auth on ${routeName} for password-protected web installs`, async () => {
      const next = jest.fn();
      const route = routes.find(({ name }) => name === routeName);

      await route.beforeEnter({}, {}, next);

      expect(mockOpenPasswordLoginModal).toHaveBeenCalledTimes(1);
      expect(mockOpenConfirmModal).not.toHaveBeenCalled();
      expect(mockOpenBiometricLoginModal).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });
  });
});
