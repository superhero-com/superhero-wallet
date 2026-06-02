import { TextEncoder, TextDecoder } from 'util';
import { vi } from 'vitest';

process.env.COMMIT_HASH = 'a1c1c5acc851c49248aad87088963f9ae5fb200e';
process.env.SDK_VERSION = '13.0.0';

// https://github.com/jestjs/jest/issues/13349
// eslint-disable-next-line no-global-assign, no-proto
Uint8Array = Buffer.__proto__ as any;

/**
 * Manually add `TextEncoder` & `TextDecoder` used by WalletConnect dependencies
 * that are not always available in the jsdom environment.
 * @link https://github.com/jsdom/jsdom/issues/2524
 */
if (!globalThis.TextEncoder) {
  Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder });
}
if (!globalThis.TextDecoder) {
  Object.defineProperty(globalThis, 'TextDecoder', { value: TextDecoder });
}

// Polyfill crypto.getRandomValues for web3/ethereum-cryptography usage in tests.
if (!globalThis.crypto || !globalThis.crypto.getRandomValues) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i += 1) arr[i] = 0;
        return arr;
      },
    },
    configurable: true,
  });
}

/**
 * The webextension `browser` global is provided by @rollup/plugin-inject in the
 * real extension build. In unit tests we expose a minimal stub on globalThis so
 * source code that reads the bare `browser` global does not throw.
 */
if (!(globalThis as any).browser) {
  (globalThis as any).browser = {
    runtime: {
      getURL: (url: string) => url,
      sendMessage: vi.fn(),
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
      connect: vi.fn(() => ({
        onMessage: { addListener: vi.fn() },
        onDisconnect: { addListener: vi.fn() },
        postMessage: vi.fn(),
      })),
    },
    storage: {
      local: {
        get: vi.fn(() => Promise.resolve({})),
        set: vi.fn(() => Promise.resolve()),
        remove: vi.fn(() => Promise.resolve()),
        clear: vi.fn(() => Promise.resolve()),
      },
    },
  };
}
