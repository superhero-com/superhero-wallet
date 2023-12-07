import '@/lib/initPolyfills';
import type {
  IPopupProps,
  PopupType,
} from '@/types';
import { executeOrSendMessageToBackground } from './utils';

export const openPopup = async (
  popupType: PopupType,
  aepp: string | object,
  params: Partial<IPopupProps> = {},
) => {
  executeOrSendMessageToBackground(
    'openPopup',
    {
      popupType,
      aepp,
      params,
    },
  );
};

export const removePopup = (id: string) => executeOrSendMessageToBackground('removePopup', { id });

export const getPopup = async (id: string) => executeOrSendMessageToBackground('getPopup', { id });
