import { describe, it, expect } from 'vitest';
import { getDappIconUrl } from '@/utils/dappIcons';
import { TRUSTED_DAPPS } from '@/constants';

describe('getDappIconUrl', () => {
  it('resolves a URL for every TRUSTED_DAPPS icon', () => {
    const uniqueImages = [...new Set(TRUSTED_DAPPS.map(({ image }) => image))];
    expect(uniqueImages.length).toBeGreaterThan(0);

    uniqueImages.forEach((image) => {
      expect(getDappIconUrl(image), `icon for "${image}"`).toBeTruthy();
    });
  });

  it('returns undefined for a missing/renamed icon file', () => {
    expect(getDappIconUrl('does-not-exist.webp')).toBeUndefined();
  });

  it('returns undefined when no image name is given', () => {
    expect(getDappIconUrl(undefined)).toBeUndefined();
    expect(getDappIconUrl(null)).toBeUndefined();
    expect(getDappIconUrl('')).toBeUndefined();
  });
});
