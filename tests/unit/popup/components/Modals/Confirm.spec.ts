// @ts-nocheck
import { mount } from '@vue/test-utils';
import Confirm from '@/popup/components/Modals/Confirm.vue';
import StatusIcon from '@/popup/components/StatusIcon.vue';

describe('Confirm modal', () => {
  const mountConfirm = (props = {}) => mount(Confirm, {
    props: { resolve: vi.fn(), reject: vi.fn(), ...props },
    global: {
      mocks: { $t: (key) => key },
      stubs: { Modal: { template: '<div><slot /><slot name="footer" /></div>' } },
    },
  });

  it('shows the icon its caller passes', () => {
    expect(mountConfirm({ icon: 'critical' }).findComponent(StatusIcon).props('status')).toBe('critical');
  });

  it('shows the info icon by default', () => {
    expect(mountConfirm().findComponent(StatusIcon).props('status')).toBe('info');
  });
});
