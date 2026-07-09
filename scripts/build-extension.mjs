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

import { spawn } from 'child_process';

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

// Set only when we intentionally kill the watch children on shutdown, so their
// signal-terminated exit (code === null) is treated as a clean stop rather than
// a failure. Outside shutdown, a null exit code means the child was killed by a
// signal (OOM, segfault) and must fail the build.
let shuttingDown = false;

/** Spawns a single `vite build` pass; returns the child plus a promise that
 * settles when it exits (which, in watch mode, is only on kill/crash). */
function runStep(step, { watch: stepWatch = false, skipEmptyOutDir = false } = {}) {
  console.info(`\n[build-extension:${browser}] step "${step}"${stepWatch ? ' (watching)' : ''}...`);
  const args = ['vite', 'build'];
  if (stepWatch) args.push('--watch');
  const child = spawn('npx', args, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...baseEnv,
      BUILD_STEP: step,
      SKIP_EMPTY_OUT_DIR: skipEmptyOutDir ? 'true' : '',
    },
  });
  const done = new Promise((resolve, reject) => {
    child.on('exit', (code) => {
      if (code === 0 || shuttingDown) resolve();
      else reject(new Error(`[build-extension:${browser}] step "${step}" failed (exit ${code}).`));
    });
  });
  return { child, done };
}

async function main() {
  // 'html' always runs first, one-off and non-watching, so the outDir
  // (manifest, popup HTML, static assets) is fully populated before any
  // other step — including html's own watcher — starts writing into it.
  await runStep('html').done;

  const rest = steps.filter((step) => step !== 'html');

  if (!watch) {
    // The remaining steps write disjoint single-file bundles and don't
    // touch the outDir's other contents, so they can run concurrently.
    await Promise.all(rest.map((step) => runStep(step).done));
    console.info(`\n[build-extension:${browser}] done.`);
    return;
  }

  // Watch mode: keep every step running concurrently for the rest of the
  // session. 'html' skips its usual emptyOutDir here — the bootstrap build
  // above already populated the dir, and the other steps may already be
  // writing into it by the time html's watcher rebuilds.
  const running = [
    runStep('html', { watch: true, skipEmptyOutDir: true }),
    ...rest.map((step) => runStep(step, { watch: true })),
  ];

  const stop = (code) => {
    shuttingDown = true;
    running.forEach(({ child }) => child.kill());
    process.exit(code);
  };
  process.on('SIGINT', () => stop(0));
  process.on('SIGTERM', () => stop(0));
  running.forEach(({ done }) => done.catch((err) => {
    console.error(err.message);
    stop(1);
  }));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
