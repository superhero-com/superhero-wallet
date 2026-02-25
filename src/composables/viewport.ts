import { debounce } from 'lodash-es';
import { onBeforeUnmount, ref } from 'vue';

export interface IScrollCallbackParams {
  isOutsideOfViewport: boolean;
}

export type OnViewportScrollCallback = (p: IScrollCallbackParams) => any;

const viewportElement = ref<Element | undefined>();

function getIonContentHost(element: Element | undefined): HTMLElement | null {
  if (!element) return null;
  const node = element as HTMLElement;
  const tagName = node.tagName?.toLowerCase?.();
  if (tagName === 'ion-content') return node;
  return node.closest?.('ion-content') as HTMLElement | null;
}

function getIonContentPartScroll(ionContentHost: HTMLElement): Element | null {
  return ionContentHost.shadowRoot?.querySelector('[part="scroll"]') as Element | null;
}

function shouldUseIonPartScroll(ionContentHost: HTMLElement, partScroll: Element | null): boolean {
  if (!partScroll) return false;

  const hostStyle = getComputedStyle(ionContentHost);
  const partStyle = getComputedStyle(partScroll as HTMLElement);
  const hostOverflow = hostStyle.overflowY;
  const partOverflow = partStyle.overflowY;
  const ionOverflowVar = hostStyle.getPropertyValue('--overflow').trim();

  return hostOverflow === 'hidden'
    && (partOverflow === 'auto' || partOverflow === 'scroll' || ionOverflowVar === 'auto');
}

function shouldRetryIonPartResolution(ionContentHost: HTMLElement): boolean {
  const style = getComputedStyle(ionContentHost);
  const hostOverflow = style.overflowY;
  const ionOverflowVar = style.getPropertyValue('--overflow').trim();

  return hostOverflow === 'hidden' || ionOverflowVar === 'auto';
}

export function resolveScrollableElement(element: Element | undefined): Element | undefined {
  if (!element) return undefined;
  const ionContentHost = getIonContentHost(element);

  if (!ionContentHost) return element;

  const partScroll = getIonContentPartScroll(ionContentHost);
  return shouldUseIonPartScroll(ionContentHost, partScroll) ? partScroll! : ionContentHost;
}

export function resolveScrollableElementWithRetry(
  element: Element | undefined,
  onResolved: (resolved: Element | undefined) => void,
  maxAttempts = 12,
): () => void {
  if (!element) {
    onResolved(undefined);
    return () => {};
  }

  const ionContentHost = getIonContentHost(element);
  if (!ionContentHost) {
    onResolved(element);
    return () => {};
  }

  let attempts = 0;
  let rafId: number | undefined;
  let stopped = false;

  const step = () => {
    if (stopped) return;
    attempts += 1;
    const resolved = resolveScrollableElement(element);
    onResolved(resolved);

    if (
      resolved === ionContentHost
      && shouldRetryIonPartResolution(ionContentHost)
      && attempts < maxAttempts
    ) {
      rafId = requestAnimationFrame(step);
    }
  };

  step();

  return () => {
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
  };
}

export const useViewport = () => {
  let stopResolveRetry: (() => void) | undefined;
  let activeScrollTarget: (Element | Window) | undefined;
  let activeScrollHandler: EventListener | undefined;

  const viewportScroll = debounce((callback: OnViewportScrollCallback) => {
    if (viewportElement.value) {
      const { scrollHeight, scrollTop, clientHeight } = viewportElement.value;
      const isOutsideOfViewport = scrollHeight - scrollTop <= clientHeight + 100;

      callback({ isOutsideOfViewport });
    }
  }, 50);

  function initViewport(scrollableElement: Element | undefined) {
    stopResolveRetry?.();
    stopResolveRetry = resolveScrollableElementWithRetry(
      scrollableElement,
      (resolved) => { viewportElement.value = resolved; },
    );
  }

  function onViewportScroll(onScrollMethod: OnViewportScrollCallback) {
    const handler = () => viewportScroll(onScrollMethod);
    const target = viewportElement.value ?? window;

    if (activeScrollTarget && activeScrollHandler) {
      activeScrollTarget.removeEventListener('scroll', activeScrollHandler);
    }

    // Prefer passive listener to avoid layout thrash
    target.addEventListener('scroll', handler as EventListener, { passive: true } as any);
    activeScrollTarget = target;
    activeScrollHandler = handler as EventListener;
  }

  onBeforeUnmount(() => {
    const currentTarget = activeScrollTarget;
    activeScrollTarget?.removeEventListener('scroll', activeScrollHandler as EventListener);
    activeScrollTarget = undefined;
    activeScrollHandler = undefined;
    stopResolveRetry?.();
    stopResolveRetry = undefined;
    if (viewportElement.value === currentTarget) {
      viewportElement.value = undefined;
    }
  });

  return {
    viewportElement,
    onViewportScroll,
    initViewport,
  };
};
