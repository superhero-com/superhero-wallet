import { Ref, computed, ref } from 'vue';
import { IAccountOverView, IPopupConfig } from '../types';

type IPopupProps = Partial<IPopupConfig>;

interface IPopupPropsState {
  popupProps: Ref<IPopupProps | null>
  sender: Ref<IAccountOverView>
  setPopupProps: (props: IPopupProps | null) => void
}

const popupProps = ref<IPopupProps | null>(null);

/**
 *  Data comming from a dapp that will be passed to the popup component
 *  when so that the user can accept or reject some action.
 */
export function usePopupProps(): IPopupPropsState {
  function setPopupProps(props: IPopupProps | null) {
    popupProps.value = props;
  }

  const sender = computed((): IAccountOverView => ({
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
