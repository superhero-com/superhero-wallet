import { IPopupConfig } from './src/types';

export { };

declare global {
  interface Window {
    popupProps?: Partial<IPopupConfig>
  }
  interface ScreenOrientation {
    lock: (orientation: 'portrait' | 'landscape' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary' | 'any') => Promise<void>
  }
}
