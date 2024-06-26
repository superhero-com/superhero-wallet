import { TextEncoder, TextDecoder } from 'util';

process.env.COMMIT_HASH = 'a1c1c5acc851c49248aad87088963f9ae5fb200e';
process.env.SDK_VERSION = '13.0.0';

// https://github.com/jestjs/jest/issues/13349
// eslint-disable-next-line no-global-assign, no-proto
Uint8Array = Buffer.__proto__;

/**
 * Manually add `TextEncoder` & `TextDecoder` used by WalletConnect dependencies
 * and are not available for the Jest environment.
 * @link https://github.com/jsdom/jsdom/issues/2524
 */
Object.defineProperty(global, 'TextEncoder', { value: TextEncoder });
Object.defineProperty(global, 'TextDecoder', { value: TextDecoder });
