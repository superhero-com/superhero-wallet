import '@/lib/initPolyfills';
import type {
  IPopupProps,
  PopupType,
} from '@/types';
import { sendMessageToBackground } from './utils';

export const openPopup = async (
  popupType: PopupType,
  aepp: string | object,
  params: Partial<IPopupProps> = {},
) => {
  sendMessageToBackground(
    'openPopup',
    {
      popupType,
      aepp,
      params,
    },
  );
};

export const removePopup = (id: string) => sendMessageToBackground('removePopup', { id });

export const getPopup = async (id: string) => sendMessageToBackground('getPopup', { id });
