import { describe, it, expect } from 'vitest';
import { vendorManualChunks } from '../../../build/plugins';

describe('vendorManualChunks', () => {
  it('leaves app source (non-node_modules) unchunked', () => {
    expect(vendorManualChunks('/repo/src/composables/airGap.ts')).toBeUndefined();
  });

  it('puts ordinary dependencies into the shared vendor chunk', () => {
    expect(vendorManualChunks('/repo/node_modules/vue/dist/vue.runtime.esm-bundler.js')).toBe('vendor');
    expect(vendorManualChunks('/repo/node_modules/bitcoinjs-lib/src/index.js')).toBe('vendor');
  });

  it('code-splits the lazily-imported AirGap dependency tree out of vendor', () => {
    expect(vendorManualChunks('/repo/node_modules/@airgap/serializer/index.js')).toBeUndefined();
    expect(vendorManualChunks('/repo/node_modules/@airgap/aeternity/index.js')).toBeUndefined();
    expect(vendorManualChunks('/repo/node_modules/airgap-coin-lib/index.js')).toBeUndefined();
    expect(vendorManualChunks('/repo/node_modules/@polkadot/wasm-crypto/index.js')).toBeUndefined();
    expect(vendorManualChunks('/repo/node_modules/libsodium/index.js')).toBeUndefined();
    expect(vendorManualChunks('/repo/node_modules/moment/moment.js')).toBeUndefined();
    expect(vendorManualChunks('/repo/node_modules/ramda/index.js')).toBeUndefined();
  });

  it('matches lazy-vendor packages on a Windows-style backslash path', () => {
    expect(vendorManualChunks('C:\\repo\\node_modules\\@airgap\\serializer\\index.js')).toBeUndefined();
  });
});
