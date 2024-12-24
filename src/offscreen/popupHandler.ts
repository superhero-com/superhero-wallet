import '../lib/initPolyfills';
import type {
  Dictionary,
  IPopupProps,
  PopupType,
} from '@/types';
import { POPUP_METHODS, SESSION_METHODS } from '@/constants';
import { executeOrSendMessageToBackground } from './utils';

interface IPopupConfig {
  id: string;
  actions: Pick<IPopupProps, 'resolve' | 'reject'>;
  props: Omit<IPopupProps, 'resolve' | 'reject'>;
}

const popups: Dictionary<IPopupConfig> = {};

export const openPopup = async (
  popupType: PopupType,
  aepp: string | object | undefined,
  popupProps: Partial<IPopupProps> = {},
) => executeOrSendMessageToBackground(
  POPUP_METHODS.openPopup,
  {
    popupProps,
    popupType,
    aepp,
  },
)
  .then((popupConfig: IPopupConfig) => new Promise<IPopupConfig>((resolve, reject) => {
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
  executeOrSendMessageToBackground(POPUP_METHODS.removePopup, { id });
};

export const getPopup = (id: string) => popups[id];

export const getSessionEncryptionKey = async (): Promise<string | null> => (
  await executeOrSendMessageToBackground(SESSION_METHODS.getSessionEncryptionKey) as string | null
);
