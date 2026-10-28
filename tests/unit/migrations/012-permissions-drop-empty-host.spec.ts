import type { IPermission } from '@/types';
import { PERMISSION_DEFAULTS } from '@/constants';
import migration from '@/migrations/012-permissions-drop-empty-host';

describe('migration 012: drop permission saved under an empty host', () => {
  const dex: IPermission = {
    ...PERMISSION_DEFAULTS, host: 'aepp.dex.superhero.com', name: 'DEX', address: true,
  };

  it('removes the empty host entry and keeps the others', async () => {
    const result = await migration({
      '': { ...PERMISSION_DEFAULTS, name: 'app.uniswap.org', address: true },
      [dex.host]: dex,
    });
    expect(result).toEqual({ [dex.host]: dex });
  });

  it('returns the value untouched when there is no empty host entry', async () => {
    const value = { [dex.host]: dex };
    await expect(migration(value)).resolves.toBe(value);
  });

  it('passes null through', async () => {
    await expect(migration(null)).resolves.toBeNull();
  });
});
