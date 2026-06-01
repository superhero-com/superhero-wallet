import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ref } from 'vue';
import { watchUntilTruthy } from '@/utils/common';

describe('watchUntilTruthy', () => {
  it('resolves with the first truthy value when no timeout is given', async () => {
    const value = ref(0);

    const promise = watchUntilTruthy(() => value.value);

    value.value = 42;
    await expect(promise).resolves.toBe(42);
  });

  it('resolves with undefined when the timeout elapses before a truthy value', async () => {
    jest.useFakeTimers();
    try {
      const value = ref(0);
      const promise = watchUntilTruthy(() => value.value, 100);

      jest.advanceTimersByTime(100);
      await expect(promise).resolves.toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it('stops watching after timeout so a later truthy value does not change the result', async () => {
    jest.useFakeTimers();
    try {
      const value = ref(0);
      const promise = watchUntilTruthy(() => value.value, 100);

      jest.advanceTimersByTime(100);
      await expect(promise).resolves.toBeUndefined();

      value.value = 99;
      jest.advanceTimersByTime(100);
      await Promise.resolve();

      // Promise was already settled; a leaked watcher would not change this.
      await expect(promise).resolves.toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it('resolves with a truthy value before the timeout and clears the timer', async () => {
    jest.useFakeTimers();
    try {
      const value = ref('ready');
      const promise = watchUntilTruthy(() => value.value, 5000);

      await expect(promise).resolves.toBe('ready');

      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not arm a timeout when the value is already truthy (fast path)', async () => {
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    try {
      const value = ref('ready');
      const promise = watchUntilTruthy(() => value.value, 5000);

      await expect(promise).resolves.toBe('ready');
      // The immediate watcher settled synchronously, so the timeout timer
      // (the one armed with the 5000ms delay) should never be created. Note
      // lodash `defer` also uses setTimeout, hence asserting on the delay.
      expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 5000);
    } finally {
      setTimeoutSpy.mockRestore();
      jest.useRealTimers();
    }
  });
});
