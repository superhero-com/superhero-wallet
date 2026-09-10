import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';

describe('useTimestampTick', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function importFresh() {
    const mod = await import('@/composables/timestampTick');
    return mod.useTimestampTick;
  }

  function mountWithTick(useTimestampTick: (cb: () => void) => void, callback: () => void) {
    return mount(defineComponent({
      setup() {
        useTimestampTick(callback);
        return {};
      },
      render: () => null,
    }));
  }

  it('invokes the callback immediately on mount', async () => {
    const useTimestampTick = await importFresh();
    const callback = vi.fn();
    mountWithTick(useTimestampTick, callback);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('invokes the callback again every 5s while mounted', async () => {
    const useTimestampTick = await importFresh();
    const callback = vi.fn();
    mountWithTick(useTimestampTick, callback);

    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(10000);
    expect(callback).toHaveBeenCalledTimes(4);
  });

  it('shares a single interval across multiple mounted subscribers', async () => {
    const useTimestampTick = await importFresh();
    const setIntervalSpy = vi.spyOn(global, 'setInterval');
    const callbackA = vi.fn();
    const callbackB = vi.fn();

    mountWithTick(useTimestampTick, callbackA);
    mountWithTick(useTimestampTick, callbackB);

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    expect(callbackA).toHaveBeenCalledTimes(2);
    expect(callbackB).toHaveBeenCalledTimes(2);
  });

  it('stops ticking one subscriber after it unmounts, without affecting the other', async () => {
    const useTimestampTick = await importFresh();
    const callbackA = vi.fn();
    const callbackB = vi.fn();

    const wrapperA = mountWithTick(useTimestampTick, callbackA);
    mountWithTick(useTimestampTick, callbackB);

    wrapperA.unmount();
    vi.advanceTimersByTime(5000);

    expect(callbackA).toHaveBeenCalledTimes(1); // only the initial immediate call
    expect(callbackB).toHaveBeenCalledTimes(2); // immediate + one tick
  });

  it('clears the interval once every subscriber has unmounted', async () => {
    const useTimestampTick = await importFresh();
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const callback = vi.fn();

    const wrapper = mountWithTick(useTimestampTick, callback);
    wrapper.unmount();

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

    // No further ticks should occur; nothing is listening anymore.
    vi.advanceTimersByTime(20000);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
