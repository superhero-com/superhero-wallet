import '@/lib/initPolyfills';
import type {
  Dictionary,
  IPopupProps,
  PopupType,
} from '@/types';
import { executeOrSendMessageToBackground } from './utils';

interface IPopupConfig {
  actions: Pick<IPopupProps, 'resolve' | 'reject'>;
  props: Omit<IPopupProps, 'resolve' | 'reject'>;
}

const popups: Dictionary<IPopupConfig> = {};

export const openPopup = async (
  popupType: PopupType,
  aepp: string | object,
  params: Partial<IPopupProps> = {},
) => executeOrSendMessageToBackground(
  'openPopup',
  {
    popupType,
    aepp,
    params,
  },
).then((popupConfig) => new Promise<IPopupConfig>((resolve, reject) => {
  const popupWithActions = {
    ...popupConfig,
    actions: {
      resolve,
      reject,
    },
  };
  const { id } = popupWithActions;
  popups[id] = popupWithActions;
  return popupWithActions;
}));

export const removePopup = async (id: string) => {
  delete popups[id];
  executeOrSendMessageToBackground('removePopup', { id });
};

export const getPopup = (id: string) => popups[id];
