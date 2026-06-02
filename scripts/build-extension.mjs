#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Orchestrates the multi-pass Vite build for the browser extension.
 *
 * A single Rollup run can only emit one output format, and the IIFE
 * service-worker / content-script bundles cannot coexist with the code-split
 * HTML build. So we run several `vite build` passes into the same outDir:
 *
 *   A) html    - popup (index.html), offscreen.html, CameraRequestPermission.html
 *   B) sw       - service worker -> js/background.js          (Chrome only)
 *   C) inject   - content script  -> js/inject.js   (self-contained IIFE)
 *   D) inpage   - content script  -> js/inpage.js   (self-contained IIFE)
 *
 * Firefox has no service worker (it uses the offscreen page as a background
 * page), so the `sw` pass is skipped there.
 *
 * Usage: node scripts/build-extension.mjs <chrome|firefox> [--watch]
 */

import { spawnSync } from 'child_process';

const browser = process.argv[2];
const watch = process.argv.includes('--watch');

if (!['chrome', 'firefox'].includes(browser)) {
  console.error('Usage: node scripts/build-extension.mjs <chrome|firefox> [--watch]');
  process.exit(1);
}

const isFirefox = browser === 'firefox';

const baseEnv = {
  ...process.env,
  PLATFORM: 'extension',
  IS_FIREFOX_EXT: isFirefox ? 'true' : '',
};

const steps = isFirefox
  ? ['html', 'inject', 'inpage']
  : ['html', 'sw', 'inject', 'inpage'];

function runStep(step) {
  console.info(`\n[build-extension:${browser}] step "${step}"...`);
  const args = ['vite', 'build'];
  if (watch) args.push('--watch');
  const result = spawnSync('npx', args, {
    stdio: 'inherit',
    shell: true,
    env: { ...baseEnv, BUILD_STEP: step },
  });
  if (result.status !== 0) {
    console.error(`[build-extension:${browser}] step "${step}" failed.`);
    process.exit(result.status ?? 1);
  }
}

steps.forEach(runStep);

console.info(`\n[build-extension:${browser}] done.`);
