// @ts-nocheck
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { CONFIRM_GUARD_DELAY, useConfirmGuard } from '@/composables/confirmGuard';

function mountWithGuard(isEnabled) {
  let guard;
  const wrapper = mount(defineComponent({
    setup() {
      guard = useConfirmGuard(isEnabled);
      return () => h('div');
    },
  }));
  return { wrapper, guard };
}

describe('useConfirmGuard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('blocks the confirmation for longer than a double click after it is shown', () => {
    const { guard } = mountWithGuard(true);
    expect(guard.isConfirmBlocked.value).toBe(true);

    vi.advanceTimersByTime(CONFIRM_GUARD_DELAY - 1);
    expect(guard.isConfirmBlocked.value).toBe(true);

    vi.advanceTimersByTime(1);
    expect(guard.isConfirmBlocked.value).toBe(false);
  });

  it('does not block outside the side panel', () => {
    const { guard } = mountWithGuard(false);
    expect(guard.isConfirmBlocked.value).toBe(false);
  });

  it('stops its timer once closed', () => {
    const { wrapper } = mountWithGuard(true);
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
