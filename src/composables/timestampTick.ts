import { onBeforeUnmount, onMounted } from 'vue';

const TICK_INTERVAL_MS = 5000;

let intervalId: NodeJS.Timeout | null = null;
const callbacks = new Set<() => void>();

function runCallbacks() {
  callbacks.forEach((callback) => callback());
}

/**
 * Shared 5s ticker for relative-time displays ("2 minutes ago") in list rows.
 * One `setInterval` backs every subscriber instead of one per rendered row --
 * with dozens of visible transaction rows, that used to mean dozens of
 * independent timers, each separately recomputing a dayjs relative time and
 * writing to its own reactive ref every 5 seconds.
 *
 * `callback` is invoked once immediately on mount (matching the previous
 * per-row `executeAndSetInterval` behavior) and again every tick while any
 * subscriber is mounted.
 */
export function useTimestampTick(callback: () => void) {
  onMounted(() => {
    callback();
    callbacks.add(callback);
    if (!intervalId) {
      intervalId = setInterval(runCallbacks, TICK_INTERVAL_MS);
    }
  });

  onBeforeUnmount(() => {
    callbacks.delete(callback);
    if (callbacks.size === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  });
}
