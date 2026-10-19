// @ts-nocheck
import { ROUTE_SEED_PHRASE_DETAILS } from '@/popup/router/routeNames';

/**
 * The reveal gate with the real `useAuth`, so the device check it relies on is the one
 * `checkBiometry` feeds rather than a mock of the composable.
 */
describe('seed phrase reveal gate on a device', () => {
  let checkBiometryMock;
  let openBiometricLoginModalMock;
  let openConfirmModalMock;

  // The first import transforms the whole route table, which a loaded runner can stretch past
  // the test timeout. `vi.resetModules` keeps the transforms, so the tests only evaluate it.
  beforeAll(() => import('@/popup/router/routes'), 60000);

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    checkBiometryMock = vi.fn();
    openBiometricLoginModalMock = vi.fn().mockResolvedValue(undefined);
    openConfirmModalMock = vi.fn().mockResolvedValue(undefined);

    vi.doMock('@aparajita/capacitor-biometric-auth', () => ({
      BiometricAuth: {
        checkBiometry: (...args) => checkBiometryMock(...args),
        authenticate: vi.fn(),
      },
    }));
    vi.doMock('@/constants', async () => ({
      ...await vi.importActual('@/constants'),
      IS_MOBILE_APP: true,
      IS_EXTENSION: false,
      IS_IOS: false,
      IS_OFFSCREEN_TAB: false,
      RUNNING_IN_TESTS: false,
    }));
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openBiometricLoginModal: (...args) => openBiometricLoginModalMock(...args),
        openConfirmModal: (...args) => openConfirmModalMock(...args),
        openPasswordLoginModal: vi.fn(),
        openEnableBiometricLoginModal: vi.fn(),
        openModal: vi.fn(),
      }),
    }));
  });

  afterEach(() => {
    vi.doUnmock('@aparajita/capacitor-biometric-auth');
    vi.doUnmock('@/constants');
    vi.doUnmock('@/composables/modals');
  });

  it.each([
    [
      'verifies the user with the passcode when biometrics are unavailable on a secured device',
      { isAvailable: false, deviceIsSecure: true },
      { biometricModalCalls: 1, confirmModalCalls: 0 },
    ],
    [
      'asks to confirm when the device can verify the user in no way',
      { isAvailable: false, deviceIsSecure: false },
      { biometricModalCalls: 0, confirmModalCalls: 1 },
    ],
  ])('%s', async (_, biometry, { biometricModalCalls, confirmModalCalls }) => {
    checkBiometryMock.mockResolvedValue(biometry);
    const { routes } = await import('@/popup/router/routes');
    const { useUi } = await import('@/composables/ui');
    useUi().setBiometricLoginEnabled(true);
    const next = vi.fn();
    const route = routes.find(({ name }) => name === ROUTE_SEED_PHRASE_DETAILS);

    await route.beforeEnter({}, {}, next);

    expect(openBiometricLoginModalMock).toHaveBeenCalledTimes(biometricModalCalls);
    expect(openConfirmModalMock).toHaveBeenCalledTimes(confirmModalCalls);
    expect(next).toHaveBeenCalledWith();
  });
});
