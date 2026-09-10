import type { Encoded } from '@aeternity/aepp-sdk';

import { fetchAccountNextNonce } from '@/protocols/aeternity/helpers';

/** The nonce every transaction the wallet broadcasts is built with. */

const ADDRESS = 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR' as Encoded.AccountAddress;

const nodeError = (statusCode: number) => Object.assign(
  new Error(`node said ${statusCode}`),
  { statusCode },
);

const apiReturning = (nextNonce: number) => ({
  getAccountNextNonce: vi.fn(async () => ({ nextNonce })),
});

const apiRejecting = (error: Error) => ({
  getAccountNextNonce: vi.fn(async () => {
    throw error;
  }),
});

describe('fetchAccountNextNonce', () => {
  it('returns the nonce the node reports', async () => {
    const api = apiReturning(9);

    expect(await fetchAccountNextNonce(api, ADDRESS)).toBe(9);
    expect(api.getAccountNextNonce).toHaveBeenCalledWith(ADDRESS);
  });

  it('falls back to 1 for an account that has never appeared on chain', async () => {
    // The node 404s rather than answering 0, and 1 is the first nonce such an
    // account can use. Throwing here instead would abort the whole signing flow.
    const api = apiRejecting(nodeError(404));

    expect(await fetchAccountNextNonce(api, ADDRESS)).toBe(1);
  });

  it('rethrows a failure that is not a 404, rather than inventing a nonce', async () => {
    // Building on a made-up nonce for an account that does exist would produce a
    // transaction the chain rejects, with the failure surfacing far from its cause.
    const api = apiRejecting(nodeError(503));

    await expect(fetchAccountNextNonce(api, ADDRESS)).rejects.toThrow('node said 503');
  });
});
