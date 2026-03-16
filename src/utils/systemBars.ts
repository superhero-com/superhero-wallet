import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';
import { StatusBar } from '@capacitor/status-bar';

import {
  IS_ANDROID,
  IS_MOBILE_APP,
} from '@/constants';

/**
 * Capacitor's StatusBar background API does not work on Android 15+,
 * so Android must use the EdgeToEdge plugin to color the system area.
 */
export async function setMobileStatusBarColor(color: string) {
  if (!IS_MOBILE_APP) return;

  if (IS_ANDROID) {
    await EdgeToEdge.setStatusBarColor({ color });
    return;
  }

  await StatusBar.setBackgroundColor({ color });
}
