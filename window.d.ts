import _browser from 'webextension-polyfill';
import { IPopupProps } from './src/types';

export { };

declare global {
  const browser = _browser;

  interface Window {
    browser: _browser;
    popupProps?: Partial<IPopupProps>;
  }
  interface ScreenOrientation {
    lock: (orientation: 'portrait' | 'landscape' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary' | 'any') => Promise<void>;
  }
  interface Navigator {
    enumerateDevices: (callback: (devices: MediaDeviceInfo[]) => void) => Promise<void>;
  }
}
