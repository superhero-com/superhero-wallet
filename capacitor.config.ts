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
  },
};

export default config;
