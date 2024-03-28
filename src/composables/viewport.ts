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
    if (viewportElement.value) {
      viewportElement.value.addEventListener('scroll', () => viewportScroll(onScrollMethod));
    }
    window.addEventListener('scroll', () => viewportScroll(onScrollMethod));
    onBeforeUnmount(() => {
      if (viewportElement.value) {
        viewportElement.value.removeEventListener('scroll', () => viewportScroll(onScrollMethod));
      }
      window.removeEventListener('scroll', () => viewportScroll(onScrollMethod));
    });
  }

  return {
    viewportElement,
    onViewportScroll,
    initViewport,
  };
};
