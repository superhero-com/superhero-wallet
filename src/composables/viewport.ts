import { debounce } from 'lodash-es';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { MOBILE_WIDTH } from '../popup/utils';

export interface IScrollCallbackParams {
  isOutsideOfViewport: boolean
}

export type OnViewportScrollCallback = (p: IScrollCallbackParams) => any;

const viewportElement = ref<Element | undefined>();

export const useViewport = () => {
  function checkIsDesktop(): boolean {
    return !!(
      document.documentElement.clientWidth > MOBILE_WIDTH
      || process.env.IS_EXTENSION
    );
  }

  const viewportScroll = debounce((callback: OnViewportScrollCallback) => {
    const element = checkIsDesktop() ? viewportElement.value : document.documentElement;

    if (element) {
      const { scrollHeight, scrollTop, clientHeight } = element;
      const isOutsideOfViewport = scrollHeight - scrollTop <= clientHeight + 100;

      callback({ isOutsideOfViewport });
    }
  }, 50);

  function initViewport(scrollableElement: Element | undefined) {
    viewportElement.value = scrollableElement;
  }

  function onViewportScroll(onScrollMethod: OnViewportScrollCallback) {
    onMounted(() => {
      if (viewportElement.value) {
        viewportElement.value.addEventListener('scroll', () => viewportScroll(onScrollMethod));
      }
      window.addEventListener('scroll', () => viewportScroll(onScrollMethod));
    });
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
