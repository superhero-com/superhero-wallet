export async function checkDeviceHasWebcam(): Promise<boolean> {
  let hasWebcam = false;

  // If we cannot enumerate devices
  if (
    !(typeof MediaStreamTrack !== 'undefined' && 'getSources' in MediaStreamTrack)
      && !navigator.mediaDevices?.enumerateDevices
  ) {
    return false;
  }

  if (navigator.mediaDevices?.enumerateDevices) {
    navigator.enumerateDevices = async (callback) => {
      await navigator.mediaDevices.enumerateDevices()
        ?.then(callback)
        ?.catch(() => {
          callback([]);
        });
    };
  }

  if (
    !navigator.enumerateDevices
      && window.MediaStreamTrack
      && (window.MediaStreamTrack as any).getSources
  ) {
    // @ts-expect-error update types
    navigator.enumerateDevices = await window.MediaStreamTrack.getSources.bind(
      window.MediaStreamTrack,
    );
  }

  if (!navigator.enumerateDevices) {
    return false;
  }

  await navigator.enumerateDevices(
    (devices) => {
      hasWebcam = devices.some(
        (device: any) => ['videoinput', 'video'].includes(device.kind),
      );
    },
  );
  return hasWebcam;
}
