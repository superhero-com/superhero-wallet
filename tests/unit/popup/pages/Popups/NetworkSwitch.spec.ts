import { mount, VueWrapper } from '@vue/test-utils';
import { ref } from 'vue';
import type { Ref } from 'vue';
import { usePopupProps } from '@/composables';
import { useConfirmGuard } from '@/composables/confirmGuard';
import { RejectedByUserError } from '@/lib/errors';
import NetworkSwitch from '@/popup/pages/Popups/NetworkSwitch.vue';
import type { IPopupProps } from '@/types';

vi.mock('@/composables', () => ({ usePopupProps: vi.fn() }));
vi.mock('@/composables/confirmGuard', () => ({ useConfirmGuard: vi.fn() }));

describe('Network switch confirmation', () => {
  let wrapper: VueWrapper;
  let request: IPopupProps;
  let popupProps: Ref<IPopupProps | null>;
  const isConfirmBlocked = ref(false);

  function mountConfirmation(props: Partial<IPopupProps> = {}) {
    request = {
      app: {
        href: 'https://aepp.example.com',
        name: 'aepp.example.com',
        host: 'aepp.example.com',
        protocol: 'https:',
      },
      networkName: 'Hyperchain',
      networkId: 'hc_test',
      nodeUrl: 'https://node.example.com',
      resolve: vi.fn(),
      reject: vi.fn(),
      ...props,
    };
    popupProps = ref(request);
    vi.mocked(usePopupProps).mockReturnValue({
      popupProps,
      sender: ref({ url: 'https://aepp.example.com' }),
      isUnknownDapp: ref(false),
      setPopupProps: vi.fn(),
    } as unknown as ReturnType<typeof usePopupProps>);
    vi.mocked(useConfirmGuard).mockReturnValue({ isConfirmBlocked });
    wrapper = mount(NetworkSwitch, {
      global: {
        mocks: { $t: (key: string) => key },
        stubs: {
          Modal: { template: '<div><slot /><slot name="footer" /></div>' },
        },
      },
    });
    return wrapper;
  }

  beforeEach(() => {
    isConfirmBlocked.value = false;
  });

  afterEach(() => wrapper?.unmount());

  it('shows the requesting site and exact target details as text', () => {
    mountConfirmation({ networkName: '<img src=x onerror=alert(1)>' });
    expect(wrapper.get('[data-cy="aepp"]').text()).toContain('https://aepp.example.com');
    expect(wrapper.get('[data-cy="network-name"]').text()).toContain('<img src=x onerror=alert(1)>');
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.get('[data-cy="network-id"]').text()).toContain('hc_test');
    expect(wrapper.get('[data-cy="node-url"]').text()).toContain('https://node.example.com');
    expect(wrapper.find('[data-cy="new-network-warning"]').exists()).toBe(false);
  });

  it('warns when the request adds a new custom network', () => {
    mountConfirmation({ isNewNetwork: true });
    expect(wrapper.get('[data-cy="new-network-warning"]').text())
      .toBe('pages.network.thirdPartyDetails');
  });

  it('confirms only after the guard permits the click', async () => {
    isConfirmBlocked.value = true;
    mountConfirmation();
    const confirm = wrapper.get<HTMLButtonElement>('[data-cy="accept"]');
    expect(confirm.attributes('aria-disabled')).toBe('true');
    // Only marked disabled, so the click reaches the page
    confirm.element.click();
    expect(request.resolve).not.toHaveBeenCalled();
    isConfirmBlocked.value = false;
    await wrapper.vm.$nextTick();
    confirm.element.click();
    expect(request.resolve).toHaveBeenCalledOnce();
    wrapper.unmount();
    expect(request.reject).not.toHaveBeenCalled();
  });

  it('rejects cancellation without approving the request', async () => {
    mountConfirmation();
    await wrapper.get('[data-cy="deny"]').trigger('click');
    expect(request.reject).toHaveBeenCalledWith(expect.any(RejectedByUserError));
    expect(request.resolve).not.toHaveBeenCalled();
  });

  it('rejects a pending request when its confirmation is removed', () => {
    mountConfirmation();
    wrapper.unmount();
    expect(request.reject).toHaveBeenCalledWith(expect.any(RejectedByUserError));
    expect(request.resolve).not.toHaveBeenCalled();
  });

  it('keeps its original target and origin when another popup changes shared props', async () => {
    mountConfirmation();
    const otherRequest: IPopupProps = {
      ...request,
      app: { ...request.app!, href: 'https://other.example.com' },
      networkName: 'Other network',
      nodeUrl: 'https://other-node.example.com',
      resolve: vi.fn(),
    };
    popupProps.value = otherRequest;
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-cy="aepp"]').text()).toContain('https://aepp.example.com');
    expect(wrapper.get('[data-cy="network-name"]').text()).toContain('Hyperchain');
    expect(wrapper.get('[data-cy="node-url"]').text()).toContain('https://node.example.com');

    popupProps.value = null;
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-cy="network-name"]').text()).toContain('Hyperchain');
    await wrapper.get('[data-cy="accept"]').trigger('click');
    expect(request.resolve).toHaveBeenCalledOnce();
    expect(otherRequest.resolve).not.toHaveBeenCalled();
  });
});
