/// <reference types="@capawesome/capacitor-android-edge-to-edge-support" />

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.superhero.cordova',
  appName: 'Superhero Wallet',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#141414',
      androidScaleType: 'CENTER_INSIDE',
      splashFullScreen: true,
      useDialog: true,
    },
    SystemBars: {
      insetsHandling: 'disable',
    },
    EdgeToEdge: {
      navigationBarColor: '#141414',
      statusBarColor: '#141414',
    },
  },
};

export default config;
