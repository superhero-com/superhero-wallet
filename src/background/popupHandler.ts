import '@/lib/initPolyfills';
import type {
  IPopupProps,
  PopupType,
} from '@/types';

export const openPopup = async (
  popupType: PopupType,
  aepp: string | object,
  params: Partial<IPopupProps> = {},
) => {
  browser.runtime.sendMessage({
    target: 'background',
    method: 'openPopup',
    params: {
      popupType,
      aepp,
      params,
    },
  });
};

export const removePopup = (id: string) => browser.runtime.sendMessage({
  target: 'background',
  method: 'removePopup',
  params: {
    id,
  },
});

export const getPopup = async (id: string) => {
  const res = await browser.runtime.sendMessage({
    target: 'background',
    method: 'getPopup',
    params: {
      id,
    },
  });
  return res;
};
