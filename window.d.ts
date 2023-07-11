import { IPopupConfig } from './src/types';

export { };

declare global {
  interface Window {
    popupProps?: Partial<IPopupConfig>
    StatusBar?: any // ionic-plugin-statusbar
    IonicDeeplink?: any
  }
}
