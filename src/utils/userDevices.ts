import { Camera } from '@capacitor/camera';
import { IS_EXTENSION, IS_MOBILE_APP } from '@/constants';
import { openInNewWindow } from './common';

/**
 * Enumerating available devices with fallback methods.
 */
export const enumerateDevices = ((): typeof navigator.enumerateDevices => {
  if (navigator.enumerateDevices) {
    return navigator.enumerateDevices;
  }
  if (navigator.mediaDevices?.enumerateDevices) {
    return async (callback: (devices: MediaDeviceInfo[]) => void) => {
      await navigator.mediaDevices.enumerateDevices()
        ?.then(callback)
        ?.catch(() => callback([]));
    };
  }
  if ((window.MediaStreamTrack as any)?.getSources) {
    return (window.MediaStreamTrack as any)?.getSources.bind(window.MediaStreamTrack);
  }
  return async () => {};
})();

export async function checkDeviceHasCamera(): Promise<boolean> {
  return new Promise((resolve) => enumerateDevices((devices) => {
    resolve(devices.some((device) => ['videoinput', 'video'].includes(device.kind)));
  }));
}

export async function checkOrRequestDeviceCameraPermission(): Promise<boolean> {
  if (IS_MOBILE_APP) {
    // Permission already granted?
    const status = await Camera.checkPermissions();
    if (status.camera === 'granted') {
      return true;
    }

    const statusRequest = await Camera.requestPermissions({ permissions: ['camera'] });
    return (statusRequest.camera === 'granted');
  }

  if (IS_EXTENSION) {
    return navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => true)
      .catch(() => {
        // Extension window is not allowed to ask for camera permission.
        // Instead we need to open separate page which asks for it.
        // Opening the window closes the extension so we are delaying it to allow
        // the app to react to returned `false` value.
        setTimeout(() => {
          openInNewWindow(browser.runtime.getURL('./CameraRequestPermission.html'));
        }, 50);
        return false;
      });
  }

  // WEB
  return new Promise((resolve) => {
    navigator.permissions
      ?.query({ name: 'camera' as PermissionName })
      .then((permissionStatus) => {
        // Permission already granted
        if (permissionStatus?.state === 'granted') {
          resolve(true);
          return;
        }

        permissionStatus?.addEventListener('change', () => {
          resolve(permissionStatus.state === 'granted');
        });

        // Different way of detecting camera permission. Mostly for Safari Browser
        // which does not update `permissionStatus` when user allows to use camera.
        navigator.mediaDevices
          ?.getUserMedia({ video: true })
          ?.then((mediaStream) => resolve(mediaStream.active))
          ?.catch(() => resolve(false));
      })
      .catch(() => resolve(false));
  });
}
