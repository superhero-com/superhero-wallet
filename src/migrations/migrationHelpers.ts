import { IS_OFFSCREEN_TAB } from '@/constants';
import { watchUntilTruthy } from '@/utils';
import { ref } from 'vue';

/**
 * Before version 2.0.2 we were using Vuex and the whole state was kept as
 * one browser/local storage entry.
 */
export const collectVuexState = (() => {
  let vuexState: Record<string, any> | null;
  const isCollecting = ref(false);
  return async () => {
    if (window?.browser) {
      if (isCollecting.value) {
        await watchUntilTruthy(isCollecting);
      } else if (!vuexState && !IS_OFFSCREEN_TAB) {
        isCollecting.value = true;
        vuexState = (await window.browser.storage.local.get('state'))?.state as any;
        isCollecting.value = false;
      }
    }
    return vuexState;
  };
})();
