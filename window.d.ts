import { IPopupConfig } from './src/types';

export { };

declare global {
  interface Window {
    popupProps?: Partial<IPopupConfig>
  }
}
