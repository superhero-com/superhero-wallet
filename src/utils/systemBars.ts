import { registerPlugin } from '@capacitor/core';
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';

import {
  IS_ANDROID,
  IS_MOBILE_APP,
} from '@/constants';

interface NavigationBarPlugin {
  /**
   * Sets the exact Android navigation bar color via window.setNavigationBarColor.
   * Required on Android 15 where the EdgeToEdge overlay is hidden behind the
   * system contrast scrim for 3-button navigation.
   */
  setColor(options: { color: string; darkButtons?: boolean }): Promise<void>;
}

const NavigationBar = registerPlugin<NavigationBarPlugin>('NavigationBar');

/** The launch splash is black. */
const SPLASH_COLOR = '#000000';

const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];

// The splash shows only at launch, never after a reload.
let isSplashShown = navigation?.type !== 'reload';
let pageColor = SPLASH_COLOR;

/**
 * Capacitor's StatusBar background API does not work on Android 15+,
 * so Android must use the EdgeToEdge plugin to color the system area.
 */
async function applyColor(color: string) {
  if (IS_ANDROID) {
    await Promise.all([
      EdgeToEdge.setStatusBarColor({ color }),
      // The EdgeToEdge nav bar overlay is covered by the Android 15 contrast
      // scrim, so set the real navigation bar color through window APIs.
      NavigationBar.setColor({ color }),
    ]);
    return;
  }

  await StatusBar.setBackgroundColor({ color });
}

/** While the launch splash shows, the bars stay black and take the last color once it hides. */
export async function setMobileStatusBarColor(color: string) {
  if (!IS_MOBILE_APP) return;

  pageColor = color;
  await applyColor(isSplashShown ? SPLASH_COLOR : color);
}

export async function hideSplashScreen() {
  try {
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } finally {
    isSplashShown = false;
    await setMobileStatusBarColor(pageColor);
  }
}
