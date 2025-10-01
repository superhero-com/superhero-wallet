import { debounce } from 'lodash-es';
import { onBeforeUnmount, ref } from 'vue';

export interface IScrollCallbackParams {
  isOutsideOfViewport: boolean;
}

export type OnViewportScrollCallback = (p: IScrollCallbackParams) => any;

const viewportElement = ref<Element | undefined>();

export const useViewport = () => {
  const viewportScroll = debounce((callback: OnViewportScrollCallback) => {
    if (viewportElement.value) {
      const { scrollHeight, scrollTop, clientHeight } = viewportElement.value;
      const isOutsideOfViewport = scrollHeight - scrollTop <= clientHeight + 100;

      callback({ isOutsideOfViewport });
    }
  }, 50);

  function initViewport(scrollableElement: Element | undefined) {
    viewportElement.value = scrollableElement;
  }

  function onViewportScroll(onScrollMethod: OnViewportScrollCallback) {
    const handler = () => viewportScroll(onScrollMethod);
    const target = viewportElement.value ?? window;
    // Prefer passive listener to avoid layout thrash
    target.addEventListener('scroll', handler as EventListener, { passive: true } as any);

    onBeforeUnmount(() => {
      target.removeEventListener('scroll', handler as EventListener);
      if (viewportElement.value === target) {
        viewportElement.value = undefined;
      }
    });
  }

  return {
    viewportElement,
    onViewportScroll,
    initViewport,
  };
};
