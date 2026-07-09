import { shallowMount } from '@vue/test-utils';
import { ref as mockRef } from 'vue';

const mockResolve = vi.fn();
const mockReject = vi.fn();
const mockHandleUnknownError = vi.fn();
const mockGetOrCreateDefaultPasswordSecret = vi.fn();
const mockIsUsingDefaultPassword = mockRef(false);

vi.mock('@/composables/auth', () => ({
  useAuth: () => ({
    isUsingDefaultPassword: mockIsUsingDefaultPassword,
  }),
}));

vi.mock('@/composables/defaultPassword', () => ({
  getOrCreateDefaultPasswordSecret: mockGetOrCreateDefaultPasswordSecret,
}));

vi.mock('@/utils', () => ({
  handleUnknownError: mockHandleUnknownError,
}));

describe('SetPassword', () => {
  beforeEach(async () => {
    mockResolve.mockClear();
    mockReject.mockClear();
    mockHandleUnknownError.mockClear();
    mockGetOrCreateDefaultPasswordSecret.mockReset();
    mockIsUsingDefaultPassword.value = false;
  });

  it('marks auth as using the default password when password setup is skipped', async () => {
    mockGetOrCreateDefaultPasswordSecret.mockResolvedValue('default-secret');

    // eslint-disable-next-line global-require
    const SetPassword = (await import('@/popup/components/Modals/SetPassword.vue')).default;
    const wrapper = shallowMount(SetPassword, {
      props: {
        resolve: mockResolve,
        reject: mockReject,
      },
    });

    await wrapper.vm.useDefaultPassword();

    expect(mockIsUsingDefaultPassword.value).toBe(true);
    expect(mockResolve).toHaveBeenCalledWith('default-secret');
    expect(mockReject).not.toHaveBeenCalled();
  });
});
