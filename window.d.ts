import { IPopupConfig } from './src/types';
import { IIonic } from './src/types/ionic';

export { };

declare global {
  interface Window {
    popupProps?: Partial<IPopupConfig>
    ionic?: IIonic
    StatusBar?: any // ionic-plugin-statusbar
    IonicDeeplink?: any
  }
}
