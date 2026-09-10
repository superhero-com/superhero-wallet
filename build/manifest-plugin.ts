import { readFileSync } from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

const FIREFOX_GECKO_ID = '{aee9e933-52b6-410a-8c3f-99c6be596b4e}';

function removeArrEntries(arr: string[] | undefined, values: string[]): void {
  if (!arr) return;
  values.forEach((val) => {
    const i = arr.findIndex((e) => e === val);
    if (i !== -1) arr.splice(i, 1);
  });
}

export interface ManifestTransformOptions {
  isFirefox: boolean;
  unfinishedFeatures: boolean;
  version: string;
}

/**
 * Pure transform of the source `src/manifest.json`, ported verbatim from the
 * `manifestTransformer` in the old `vue.config.js`.
 */
export function transformManifest(
  manifest: any,
  { isFirefox, unfinishedFeatures, version }: ManifestTransformOptions,
): any {
  /* eslint-disable no-param-reassign -- intentional in-place transform of the manifest object */
  manifest.version = version;

  if (unfinishedFeatures) {
    manifest.permissions.push('clipboardRead');
  }

  if (isFirefox) {
    // Firefox MV3 has no service worker — use the offscreen page as a background page.
    manifest.background = { page: '/offscreen.html' };
    manifest.browser_specific_settings = { gecko: { id: FIREFOX_GECKO_ID } };

    // sidePanel is a chrome-specific feature — these settings cause warnings in FF.
    delete manifest.side_panel;
    removeArrEntries(manifest.permissions, ['sidePanel']);
  } else {
    manifest.permissions.push('offscreen');
    delete manifest.sidebar_action;
  }

  /* eslint-enable no-param-reassign */
  return manifest;
}

/**
 * Emits the transformed `manifest.json` into the build output (extension only).
 */
export function manifestPlugin(opts: ManifestTransformOptions): Plugin {
  return {
    name: 'sh:manifest',
    apply: 'build',
    generateBundle() {
      const raw = JSON.parse(
        readFileSync(path.resolve(process.cwd(), 'src/manifest.json'), 'utf-8'),
      );
      const manifest = transformManifest(raw, opts);
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: JSON.stringify(manifest, null, 2),
      });
    },
  };
}
