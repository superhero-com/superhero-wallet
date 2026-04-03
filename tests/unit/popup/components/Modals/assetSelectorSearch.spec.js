import { PROTOCOLS } from '@/constants';
import { STUB_TOKEN_CONTRACT_ADDRESS } from '@/constants/stubs';
import {
  getAssetIdentityKey,
  getAssetSelectorDisplayList,
  getAssetSelectorListKey,
  getAssetSelectorSearchMode,
  resolveSearchNextPageUrl,
} from '@/popup/components/Modals/assetSelectorSearch';

describe('assetSelectorSearch helpers', () => {
  it('detects browse, prefix, and exact-contract modes', () => {
    expect(getAssetSelectorSearchMode('', PROTOCOLS.aeternity, false)).toBe('browse');
    expect(getAssetSelectorSearchMode('ae', PROTOCOLS.aeternity, false)).toBe('remote-prefix');
    expect(
      getAssetSelectorSearchMode(STUB_TOKEN_CONTRACT_ADDRESS, PROTOCOLS.aeternity, false),
    ).toBe('exact-contract');
    expect(getAssetSelectorSearchMode('ae', PROTOCOLS.aeternity, true)).toBe('browse');
  });

  it('builds unique identity keys per protocol', () => {
    expect(getAssetIdentityKey({
      protocol: PROTOCOLS.aeternity,
      contractId: 'same-id',
    })).toBe('aeternity:same-id');

    expect(getAssetIdentityKey({
      protocol: PROTOCOLS.ethereum,
      contractId: 'same-id',
    })).toBe('ethereum:same-id');
  });

  it('merges remote prefix results with local matches and keeps native coin', () => {
    const aeCoin = {
      protocol: PROTOCOLS.aeternity,
      contractId: 'ae',
      symbol: 'AE',
      name: 'Aeternity',
    };
    const localAlpha = {
      protocol: PROTOCOLS.aeternity,
      contractId: 'ct_local_alpha',
      symbol: 'ALP',
      name: 'Alpha Local',
    };
    const remoteAlphaDuplicate = {
      protocol: PROTOCOLS.aeternity,
      contractId: 'ct_local_alpha',
      symbol: 'ALP',
      name: 'Alpha Local',
    };
    const remoteBeta = {
      protocol: PROTOCOLS.aeternity,
      contractId: 'ct_remote_beta',
      symbol: 'BET',
      name: 'Beta Remote',
    };

    expect(getAssetSelectorDisplayList(
      [aeCoin, localAlpha],
      [remoteAlphaDuplicate, remoteBeta],
      PROTOCOLS.aeternity,
      'remote-prefix',
    )).toEqual([
      aeCoin,
      localAlpha,
      remoteBeta,
    ]);
  });

  it('generates distinct keys for browse vs search modes', () => {
    expect(getAssetSelectorListKey(PROTOCOLS.aeternity, 'browse', ''))
      .toBe('aeternity:browse:empty');
    expect(getAssetSelectorListKey(PROTOCOLS.aeternity, 'browse', 'alp'))
      .toBe('aeternity:browse:alp');
    expect(getAssetSelectorListKey(PROTOCOLS.aeternity, 'remote-prefix', 'alp'))
      .toBe('aeternity:remote-prefix:alp');
  });

  it('preserves retryable cursors on failed remote fetches', () => {
    expect(resolveSearchNextPageUrl(null, '/cursor', true)).toBe('/cursor');
    expect(resolveSearchNextPageUrl(null, '/cursor', false)).toBeUndefined();
    expect(resolveSearchNextPageUrl({ data: [], next: '/next' }, undefined, false)).toBe('/next');
  });
});
