import {
  Ref,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  watchEffect,
} from 'vue';
import { useConnection } from './connection';
import { useUi } from './ui';

/**
 * Ionic keeps a page mounted when another page is pushed over it and only marks it with this class.
 */
const IONIC_PAGE_HIDDEN_CLASS = 'ion-page-hidden';

const pageHiddenStates = new WeakMap<Element, Ref<boolean>>();

function getPageHiddenState(page: Element) {
  let isHidden = pageHiddenStates.get(page);
  if (!isHidden) {
    const isHiddenRef = ref(page.classList.contains(IONIC_PAGE_HIDDEN_CLASS));
    new MutationObserver(() => {
      isHiddenRef.value = page.classList.contains(IONIC_PAGE_HIDDEN_CLASS);
    }).observe(page, { attributes: true, attributeFilter: ['class'] });
    pageHiddenStates.set(page, isHiddenRef);
    isHidden = isHiddenRef;
  }
  return isHidden;
}

function getIonPageAncestors(node: Node | null) {
  const pages: Element[] = [];
  let page = (node instanceof Element ? node : node?.parentElement)?.closest('.ion-page');
  while (page) {
    pages.push(page);
    page = page.parentElement?.closest('.ion-page');
  }
  return pages;
}

/**
 * Whether the Ionic pages holding the component are shown.
 * Stays `true` until it is mounted and outside of a component.
 */
export function usePageVisibility() {
  const instance = getCurrentInstance();
  const isPageVisible = ref(true);
  if (instance) {
    onMounted(() => {
      const hiddenStates = getIonPageAncestors(instance.vnode.el as Node | null)
        .map(getPageHiddenState);
      // Created in a hook so it stops with the component
      watchEffect(() => {
        isPageVisible.value = hiddenStates.every((isHidden) => !isHidden.value);
      });
    });
  }
  return isPageVisible;
}

/**
 * Creates a function, that will monitor how many components is actually using the composable
 * and if the value is greater than 0 it will perform a polling based on the setInterval function.
 * Components placed on a page hidden by Ionic navigation are not counted.
 * This function should be called before actual composable.
 */
export function createPollingBasedOnMountedComponents(interval: number) {
  const { isOnline } = useConnection();
  const { isAppActive } = useUi();

  let lastCallTime = 0;
  let pollingTimeoutId: NodeJS.Timeout | null = null;
  let pollingIntervalId: NodeJS.Timeout | null = null;
  let activeComponents = 0;

  function startPolling(callback: () => void) {
    if (pollingTimeoutId || pollingIntervalId) {
      return;
    }

    function callbackWrapper() {
      if (isOnline.value && isAppActive.value) {
        lastCallTime = Date.now();
        callback();
      }
    }

    function poll() {
      pollingTimeoutId = null;
      callbackWrapper();
      pollingIntervalId = setInterval(() => callbackWrapper(), interval);
    }

    // Keep the interval between calls when polling resumes after a pause.
    // Capped in case the clock was set back while paused.
    const delay = lastCallTime ? Math.min(lastCallTime + interval - Date.now(), interval) : 0;
    if (delay > 0) {
      pollingTimeoutId = setTimeout(poll, delay);
    } else {
      poll();
    }
  }

  function stopPolling() {
    if (pollingTimeoutId) {
      clearTimeout(pollingTimeoutId);
      pollingTimeoutId = null;
    }
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }
  }

  /**
   * Polling watcher - function that should be called inside a composable.
   */
  return (callback: () => void) => {
    const instance = getCurrentInstance();

    if (!instance) {
      return;
    }

    const isPageVisible = usePageVisibility();
    let isMounted = false;
    let isCounted = false;

    function updateActiveComponents(isVisible: boolean) {
      const shouldBeCounted = isMounted && isVisible;
      if (shouldBeCounted === isCounted) {
        return;
      }
      isCounted = shouldBeCounted;
      activeComponents += shouldBeCounted ? 1 : -1;

      if (activeComponents > 0) {
        startPolling(callback);
      } else {
        stopPolling();
      }
    }

    onMounted(() => {
      // Created in a hook so it stops with the component even if called from a detached scope
      watch(isPageVisible, updateActiveComponents);
      isMounted = true;
      updateActiveComponents(isPageVisible.value);
    });

    onBeforeUnmount(() => {
      isMounted = false;
      updateActiveComponents(false);
    });
  };
}
