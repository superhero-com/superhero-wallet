import { computed, ref } from 'vue';
import type { IAccountOverview, IPopupProps } from '@/types';

const popupProps = ref<IPopupProps | null>(null);

/**
 * Data coming from a dapp that will be passed to the popup component
 * when so that the user can accept or reject some action.
 */
export function usePopupProps() {
  function setPopupProps(props: IPopupProps | null) {
    popupProps.value = props;
  }

  const sender = computed((): IAccountOverview => ({
    name: popupProps.value?.app?.name,
    address: popupProps.value?.app?.host,
    url: popupProps.value?.app?.url,
  }));

  return {
    sender,
    popupProps,
    setPopupProps,
  };
}
