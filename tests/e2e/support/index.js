import './commands';
import './coingecko-stubs';

// Cypress injects a partial `process` object into the application window (only
// `process.env`, no `process.browser`, no string `process.version`) after the window
// is created. `vite-plugin-node-polyfills` installs its browser shim with
// `globalThis.process = globalThis.process || shim`, so Cypress's partial process wins
// and the crypto deps (ripemd160 -> readable-stream) crash on `process.version.slice(...)`
// during `create-hash`. (The old webpack build injected `process` as a per-module local
// via ProvidePlugin, so this never surfaced.) Define `process` as an accessor before the
// app loads so that whatever value gets assigned is merged onto a base that always keeps
// `browser`/`version` populated. Real browsers never assign `process`, so the base is
// what the app reads.
Cypress.on('window:before:load', (win) => {
  let value = { browser: true, version: '', env: {} };
  Object.defineProperty(win, 'process', {
    configurable: true,
    enumerable: true,
    get() {
      return value;
    },
    set(next) {
      if (next && typeof next === 'object') {
        value = Object.assign(value, next);
        if (!value.browser) value.browser = true;
        if (typeof value.version !== 'string') value.version = '';
        if (!value.env) value.env = {};
      } else {
        value = next;
      }
    },
  });
});
