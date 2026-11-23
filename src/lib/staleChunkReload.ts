import { IS_WEB } from '@/constants';
import { composeStorageKeys } from '@/utils';

/** Within it a chunk missing for good doesn't reload the page again */
export const STALE_CHUNK_RELOAD_INTERVAL = 60000;
const RELOADED_AT_KEY = composeStorageKeys('staleChunkReloadedAt');

/** A deploy removes the chunks that a page opened before it still loads on demand */
export function reloadOnStaleChunk(event: Event) {
  // A reload while offline ends on the browser's error page
  if (!navigator.onLine) return;
  try {
    const reloadedAt = Number(sessionStorage.getItem(RELOADED_AT_KEY));
    if (Date.now() - reloadedAt < STALE_CHUNK_RELOAD_INTERVAL) return;
    sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
  } catch {
    // Unrecorded, a reload could repeat
    return;
  }
  event.preventDefault();
  window.location.reload();
}

/** The extension and the apps ship their chunks */
export function initStaleChunkReload() {
  if (IS_WEB) {
    window.addEventListener('vite:preloadError', reloadOnStaleChunk);
  }
}
