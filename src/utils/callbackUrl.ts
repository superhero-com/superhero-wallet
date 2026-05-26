import type { LocationQuery } from 'vue-router';

import { AGGREGATOR_URL } from '@/constants';

/**
 * Custom URL schemes registered for this app (see `android:scheme` in
 * `android/app/src/main/AndroidManifest.xml`; iOS exposes `superhero` in
 * `CFBundleURLSchemes`). Allowing these restores native return-to-dApp flows
 * via `window.open(..., '_system')` without permitting arbitrary `myapp:` URLs.
 */
const ALLOWED_NATIVE_CALLBACK_PROTOCOLS = new Set<string>(['superhero:', 'wc:']);

const TRUSTED_CALLBACK_HOSTNAME = (() => {
  try {
    return new URL(AGGREGATOR_URL).hostname;
  } catch {
    return '';
  }
})();

function getCallbackUrlString(value: LocationQuery[string]): string | null {
  return (typeof value === 'string' && value.length > 0) ? value : null;
}

export function isTrustedCallbackUrl(url: URL): boolean {
  if (ALLOWED_NATIVE_CALLBACK_PROTOCOLS.has(url.protocol)) {
    return true;
  }
  if (!TRUSTED_CALLBACK_HOSTNAME || url.protocol !== 'https:') {
    return false;
  }
  const { hostname } = url;
  return (
    hostname === TRUSTED_CALLBACK_HOSTNAME
    || hostname.endsWith(`.${TRUSTED_CALLBACK_HOSTNAME}`)
  );
}

export function validateCallbackUrl(rawUrl: LocationQuery[string]): URL | null {
  const urlString = getCallbackUrlString(rawUrl);
  if (!urlString) return null;

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    try {
      url = new URL(decodeURIComponent(urlString));
    } catch {
      return null;
    }
  }

  if (['https:', 'http:'].includes(url.protocol)) {
    return url;
  }
  if (ALLOWED_NATIVE_CALLBACK_PROTOCOLS.has(url.protocol)) {
    return url;
  }
  return null;
}

export function checkIfSuperheroCallbackUrl(query: LocationQuery): boolean {
  return [query['x-success'], query['x-cancel']].every((value) => {
    const parsedUrl = validateCallbackUrl(value);
    return !!parsedUrl && isTrustedCallbackUrl(parsedUrl);
  });
}
