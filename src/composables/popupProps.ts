import { Ref, ref } from 'vue';
import { IPopupConfig } from '../types';

type IPopupProps = Partial<IPopupConfig>;

interface IPopupPropsState {
  popupProps: Ref<IPopupProps | null>
  // eslint-disable-next-line no-unused-vars
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

  return {
    popupProps,
    setPopupProps,
  };
}
