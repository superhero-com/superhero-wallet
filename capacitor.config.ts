/// <reference types="@capawesome/capacitor-android-edge-to-edge-support" />

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.superhero.cordova',
  appName: 'Superhero Wallet',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  android: {
    // On Android 15 edge-to-edge is enforced and the navigation bar is always
    // transparent, so its color is whatever view paints behind it. Without this
    // the WebView keeps its default white background and shows white through the
    // nav bar once the splash dialog is dismissed. Match the app's dark chrome.
    backgroundColor: '#141414',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#000000',
      androidSplashResourceName: 'launch_screen',
      androidScaleType: 'CENTER_INSIDE',
      splashFullScreen: true,
      useDialog: true,
    },
    SystemBars: {
      insetsHandling: 'disable',
      // The app is dark-only. Without this, SystemBars follows the device's
      // system theme and on a light-themed phone sets a LIGHT navigation bar,
      // which the OS renders with a white contrast scrim once the splash hides.
      style: 'DARK',
    },
    EdgeToEdge: {
      navigationBarColor: '#000000',
      statusBarColor: '#000000',
    },
  },
};

export default config;
