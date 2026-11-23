// @ts-nocheck
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { CONFIRM_GUARD_DELAY, useConfirmGuard } from '@/composables/confirmGuard';

const environment = vi.hoisted(() => ({
  IS_SIDE_PANEL: false,
  IS_EXTENSION: false,
  RUNNING_IN_POPUP: false,
}));
vi.mock('@/constants', () => environment);

function mountWithGuard(isEnabled?: boolean) {
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

  it.each([
    ['extension', 'side panel', true],
    ['extension', 'approval popup', true],
    ['extension', 'toolbar', false],
    ['web', 'approval popup', false],
  ])('sets the initial guard for %s %s to %s', (platform, view, blocked) => {
    environment.IS_SIDE_PANEL = view === 'side panel';
    environment.IS_EXTENSION = platform === 'extension';
    environment.RUNNING_IN_POPUP = view === 'approval popup';
    const { wrapper, guard } = mountWithGuard();
    expect(guard.isConfirmBlocked.value).toBe(blocked);
    wrapper.unmount();
  });

  it('stops its timer once closed', () => {
    const { wrapper } = mountWithGuard(true);
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
