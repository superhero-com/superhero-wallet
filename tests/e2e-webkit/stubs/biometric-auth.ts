import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth/dist/esm/index.js';

// The plugin's web version asks with `confirm()` in place of Face ID. One call at a time:
// calls made while it loads would each create their own instance.
if ((window as any).hasFaceId) {
  await BiometricAuth.setBiometryType(BiometryType.faceId);
  await BiometricAuth.setBiometryIsEnrolled(true);
  await BiometricAuth.setDeviceIsSecure(true);
}

export * from '@aparajita/capacitor-biometric-auth/dist/esm/index.js';
