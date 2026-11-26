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

  async function mountSetPassword(props = {}) {
    // eslint-disable-next-line global-require
    const SetPassword = (await import('@/popup/components/Modals/SetPassword.vue')).default;
    return shallowMount(SetPassword, {
      props: {
        resolve: mockResolve,
        reject: mockReject,
        ...props,
      },
    });
  }

  it('rejects as cancelled by the user when closed, which callers keep quiet about', async () => {
    const { RejectedByUserError } = await import('@/lib/errors');
    const wrapper = await mountSetPassword();

    wrapper.findComponent({ name: 'Modal' }).vm.$emit('close');

    expect(mockReject).toHaveBeenCalledWith(expect.any(RejectedByUserError));
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it('cannot be closed for a restored wallet, which needs a password', async () => {
    const wrapper = await mountSetPassword({ isRestoredWallet: true });

    wrapper.findComponent({ name: 'Modal' }).vm.$emit('close');

    expect(mockReject).not.toHaveBeenCalled();
  });

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
