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

  it('excludes the lazy tree\'s prefix-sharing packages because they are listed, not by accident', () => {
    // Both are reachable only from lazy roots (ramda-adjunct from swagger-client,
    // libsodium-wrappers from airgap-coin-lib), so they belong outside vendor —
    // but they must earn that via their own entry, not by `ramda`/`libsodium`
    // matching them as a bare prefix.
    expect(vendorManualChunks('/repo/node_modules/ramda-adjunct/es/index.js')).toBeUndefined();
    expect(vendorManualChunks('/repo/node_modules/libsodium-wrappers/dist/index.js')).toBeUndefined();
  });

  it('does not let a bare lazy package name swallow unrelated packages that share its prefix', () => {
    expect(vendorManualChunks('/repo/node_modules/momentjs-fake/index.js')).toBe('vendor');
    expect(vendorManualChunks('/repo/node_modules/swagger-client-extra/index.js')).toBe('vendor');
  });

  it('matches lazy packages nested under another package\'s node_modules', () => {
    expect(vendorManualChunks('/repo/node_modules/swagger-client/node_modules/ramda/index.js')).toBeUndefined();
  });

  it('matches lazy-vendor packages on a Windows-style backslash path', () => {
    expect(vendorManualChunks('C:\\repo\\node_modules\\@airgap\\serializer\\index.js')).toBeUndefined();
  });
});
