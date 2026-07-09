/**
 * Resolves dapp icon assets located in `src/icons/dapp` by their file name.
 *
 * Replaces the webpack-era dynamic `require()` which is unavailable under Vite.
 * Icons are eagerly imported as URLs so they can be looked up at runtime by the
 * `image` value stored in `TRUSTED_DAPPS`.
 */
// `import.meta.glob` is a Vite-only compile-time macro. The Vite build replaces
// this call with the resolved icon map, so the app loads icons correctly. The
// Cypress spec bundle is compiled by webpack (via @/utils), where `import.meta`
// is `{}` and the call throws at module init — the guard keeps that import safe.
let dappIcons: Record<string, string> = {};
try {
  // `?no-inline` keeps these out of the always-loaded main chunk as emitted
  // files — without it, every icon under `assetsInlineLimit` (4096 bytes, and
  // all of these are) gets base64-inlined into the eagerly-evaluated glob
  // result, even though they're only used in the in-app browser views.
  dappIcons = import.meta.glob('@/icons/dapp/*', {
    eager: true,
    query: '?url&no-inline',
    import: 'default',
  }) as Record<string, string>;
} catch {
  dappIcons = {};
}

const dappIconsByName: Record<string, string> = Object.fromEntries(
  Object.entries(dappIcons).map(([path, url]) => [path.split('/').pop()!, url]),
);

export function getDappIconUrl(image?: string | null): string | undefined {
  if (!image) {
    return undefined;
  }
  return dappIconsByName[image];
}
