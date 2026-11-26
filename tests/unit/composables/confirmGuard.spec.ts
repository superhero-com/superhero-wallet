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

function mountWithGuard(isEnabled?: boolean, attachTo?: HTMLElement) {
  let guard;
  const wrapper = mount(defineComponent({
    setup() {
      guard = useConfirmGuard(isEnabled);
      // A control of the page may keep its presses to itself
      return () => h('button', { onPointerdown: (event) => event.stopPropagation() });
    },
  }), { attachTo });
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

  const press = () => window.dispatchEvent(new Event('pointerdown'));

  it('stays blocked until no click came for as long', () => {
    const { wrapper, guard } = mountWithGuard(true, document.body);

    vi.advanceTimersByTime(CONFIRM_GUARD_DELAY - 100);
    wrapper.get('button').element.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    vi.advanceTimersByTime(CONFIRM_GUARD_DELAY - 1);
    expect(guard.isConfirmBlocked.value).toBe(true);

    vi.advanceTimersByTime(1);
    expect(guard.isConfirmBlocked.value).toBe(false);
    wrapper.unmount();
  });

  it('is not blocked again by a click once it let the confirmation through', () => {
    const { wrapper, guard } = mountWithGuard(true);
    vi.advanceTimersByTime(CONFIRM_GUARD_DELAY);

    press();

    expect(guard.isConfirmBlocked.value).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    wrapper.unmount();
  });

  it('ignores clicks once closed', () => {
    const { wrapper } = mountWithGuard(true);
    wrapper.unmount();

    press();

    expect(vi.getTimerCount()).toBe(0);
  });

  it('ignores clicks when disabled', () => {
    const { wrapper, guard } = mountWithGuard(false);

    press();

    expect(guard.isConfirmBlocked.value).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    wrapper.unmount();
  });
});
