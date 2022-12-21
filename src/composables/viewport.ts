import { debounce } from 'lodash-es';
import { onBeforeUnmount, onMounted, ref } from '@vue/composition-api';
import { MOBILE_WIDTH } from '../popup/utils';

export interface IScrollCallbackParams {
  isOutsideOfViewport: boolean
}

const viewportElement = ref();

export const useViewport = () => {
  const viewportScroll = debounce((callback: Function) => {
    const isDesktop = (
      document.documentElement.clientWidth > MOBILE_WIDTH
      || process.env.IS_EXTENSION
    );

    const { scrollHeight, scrollTop, clientHeight } = isDesktop
      ? viewportElement.value
      : document.documentElement;

    const isOutsideOfViewport = scrollHeight - scrollTop <= clientHeight + 100;

    callback({ isOutsideOfViewport });
  }, 50);

  function initViewport(scrollableElement: HTMLDivElement | null) {
    viewportElement.value = scrollableElement;
  }

  function onViewportScroll(onScrollMethod: Function) {
    onMounted(() => {
      viewportElement.value.addEventListener('scroll', () => viewportScroll(onScrollMethod));
      window.addEventListener('scroll', () => viewportScroll(onScrollMethod));
    });
    onBeforeUnmount(() => {
      viewportElement.value.removeEventListener('scroll', () => viewportScroll(onScrollMethod));
      window.removeEventListener('scroll', () => viewportScroll(onScrollMethod));
    });
  }

  return {
    onViewportScroll,
    initViewport,
  };
};
