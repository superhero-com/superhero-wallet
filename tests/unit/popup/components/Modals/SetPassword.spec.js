import { shallowMount } from '@vue/test-utils';

const mockResolve = vi.fn();
const mockReject = vi.fn();
const mockGenerateDefaultPasswordSecret = vi.fn();

vi.mock('@/composables/defaultPassword', () => ({
  generateDefaultPasswordSecret: mockGenerateDefaultPasswordSecret,
}));

describe('SetPassword', () => {
  beforeEach(async () => {
    mockResolve.mockClear();
    mockReject.mockClear();
    mockGenerateDefaultPasswordSecret.mockReset();
  });

  async function mountSetPassword() {
    // eslint-disable-next-line global-require
    const SetPassword = (await import('@/popup/components/Modals/SetPassword.vue')).default;
    return shallowMount(SetPassword, {
      props: {
        resolve: mockResolve,
        reject: mockReject,
      },
    });
  }

  it('resolves a generated secret marked as skipped, storing nothing before the password commit', async () => {
    mockGenerateDefaultPasswordSecret.mockReturnValue('default-secret');
    const wrapper = await mountSetPassword();

    wrapper.vm.useDefaultPassword();

    expect(mockResolve).toHaveBeenCalledWith({
      password: 'default-secret',
      isDefaultPasswordSecret: true,
    });
    expect(mockReject).not.toHaveBeenCalled();
  });

  it('resolves a typed password as not the default secret', async () => {
    const wrapper = await mountSetPassword();
    wrapper.vm.password = 'typed-password';

    wrapper.vm.onSubmit();

    expect(mockResolve).toHaveBeenCalledWith({
      password: 'typed-password',
      isDefaultPasswordSecret: false,
    });
    expect(mockGenerateDefaultPasswordSecret).not.toHaveBeenCalled();
  });
});
