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
  .then((popupConfig: IPopupConfig) => (
    // The resolution value comes from whatever the confirmation modal passes to
    // its `resolve` prop (e.g. the account the user chose to sign with), not
    // from `popupConfig`, so it can't be typed as `IPopupConfig`.
    new Promise<any>((resolve, reject) => {
      const { id } = popupConfig;
      popups[id] = {
        ...popupConfig,
        actions: { resolve, reject },
      };
    })
  ));

export const removePopup = async (id: string) => {
  delete popups[id];
  executeOrSendMessageToBackground(POPUP_METHODS.removePopup, { id });
};

export const getPopup = (id: string) => popups[id];

export const getSessionEncryptionKey = async (): Promise<string | null> => (
  await executeOrSendMessageToBackground(SESSION_METHODS.getSessionEncryptionKey) as string | null
);
