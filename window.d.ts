import { ICordova } from './src/types/cordova';

export {};

declare global {
  interface Window {
    popupProps?: any
    cordova?: ICordova
    StatusBar?: any // cordova-plugin-statusbar
    IonicDeeplink?: any
  }
}
