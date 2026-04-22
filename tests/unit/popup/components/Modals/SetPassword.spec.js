import { shallowMount } from '@vue/test-utils';
import { ref as mockRef } from 'vue';

const mockResolve = jest.fn();
const mockReject = jest.fn();
const mockHandleUnknownError = jest.fn();
const mockGetOrCreateDefaultPasswordSecret = jest.fn();
const mockIsUsingDefaultPassword = mockRef(false);

jest.mock('@/composables/auth', () => ({
  useAuth: () => ({
    isUsingDefaultPassword: mockIsUsingDefaultPassword,
  }),
}));

jest.mock('@/composables/defaultPassword', () => ({
  getOrCreateDefaultPasswordSecret: mockGetOrCreateDefaultPasswordSecret,
}));

jest.mock('@/utils', () => ({
  handleUnknownError: mockHandleUnknownError,
}));

describe('SetPassword', () => {
  beforeEach(() => {
    mockResolve.mockClear();
    mockReject.mockClear();
    mockHandleUnknownError.mockClear();
    mockGetOrCreateDefaultPasswordSecret.mockReset();
    mockIsUsingDefaultPassword.value = false;
  });

  it('marks auth as using the default password when password setup is skipped', async () => {
    mockGetOrCreateDefaultPasswordSecret.mockResolvedValue('default-secret');

    // eslint-disable-next-line global-require
    const SetPassword = require('@/popup/components/Modals/SetPassword.vue').default;
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
