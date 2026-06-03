import { registerPlugin } from '@capacitor/core';
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';
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

/**
 * Capacitor's StatusBar background API does not work on Android 15+,
 * so Android must use the EdgeToEdge plugin to color the system area.
 */
export async function setMobileStatusBarColor(color: string) {
  if (!IS_MOBILE_APP) return;

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
