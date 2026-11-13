// The launch splash is native. After the app asks to hide it, window.hideSplash() finishes that.
export const SplashScreen = {
  hide: () => new Promise<void>((resolve) => {
    Object.assign(window, { hideSplash: resolve });
  }),
};
