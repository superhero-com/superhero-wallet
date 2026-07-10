import { ref } from 'vue';

/**
 * `useAeAddressLinkBackend` drives the Superhero API preferred-AENS-name flow:
 * request a challenge (`/claim` or `/unclaim`), sign it with the active account,
 * then POST the signature to `/submit` so the backend broadcasts (and pays for)
 * the on-chain link. `postJson` (the HTTP boundary), the SDK message signing and
 * the network settings are mocked so the tests assert the request payloads, the
 * hex signature and the base-URL handling.
 */

const BASE_PATH = '/api/address-links/prefered-aens-name';

async function loadComposable(opts = {}) {
  const superheroApiUrl = 'superheroApiUrl' in opts ? opts.superheroApiUrl : 'https://api.test';
  const signature = opts.signature ?? new Uint8Array([1, 2, 255]);
  vi.resetModules();

  const postJson = vi.fn().mockImplementation((url) => {
    if (url.endsWith('/unclaim')) return Promise.resolve({ message: 'sign-unlink', nonce: 9 });
    if (url.endsWith('/claim')) {
      return Promise.resolve({
        message: 'sign-me', nonce: 7, value: 'name.chain', verification_token: 'vt',
      });
    }
    if (url.endsWith('/submit')) return Promise.resolve({ txHash: 'th_ok' });
    return Promise.resolve(null);
  });
  const signMessage = vi.fn().mockResolvedValue(signature);
  const getAeSdk = vi.fn().mockResolvedValue({ signMessage });

  vi.doMock('@/utils', () => ({ postJson }));
  vi.doMock('@/composables', () => ({ useAeSdk: () => ({ getAeSdk }) }));
  vi.doMock('@/protocols/aeternity/composables/aeNetworkSettings', () => ({
    useAeNetworkSettings: () => ({
      aeActiveNetworkPredefinedSettings: ref({ superheroApiUrl }),
    }),
  }));

  const mod = await import('@/protocols/aeternity/composables/aeAddressLinkBackend');
  return { composable: mod.useAeAddressLinkBackend(), postJson, signMessage };
}

describe('useAeAddressLinkBackend', () => {
  it('links a preferred name via claim -> sign -> submit', async () => {
    const { composable, postJson, signMessage } = await loadComposable();

    const txHash = await composable.linkPreferredAensName('ak_test', 'name.chain');

    expect(postJson).toHaveBeenNthCalledWith(1, `https://api.test${BASE_PATH}/claim`, {
      body: { address: 'ak_test', value: 'name.chain' },
    });
    // The backend-issued challenge is what gets signed.
    expect(signMessage).toHaveBeenCalledWith('sign-me');
    // Signature is the hex encoding of the raw signed bytes.
    expect(postJson).toHaveBeenNthCalledWith(2, `https://api.test${BASE_PATH}/submit`, {
      body: {
        address: 'ak_test',
        value: 'name.chain',
        nonce: 7,
        signature: '0102ff',
        verification_token: 'vt',
      },
    });
    expect(txHash).toBe('th_ok');
  });

  it('unlinks a preferred name via unclaim -> sign -> submit', async () => {
    const { composable, postJson, signMessage } = await loadComposable();

    const txHash = await composable.unlinkPreferredAensName('ak_test');

    expect(postJson).toHaveBeenNthCalledWith(1, `https://api.test${BASE_PATH}/unclaim`, {
      body: { address: 'ak_test' },
    });
    expect(signMessage).toHaveBeenCalledWith('sign-unlink');
    expect(postJson).toHaveBeenNthCalledWith(2, `https://api.test${BASE_PATH}/unclaim/submit`, {
      body: { address: 'ak_test', nonce: 9, signature: '0102ff' },
    });
    expect(txHash).toBe('th_ok');
  });

  it('strips a trailing slash from the configured API URL', async () => {
    const { composable, postJson } = await loadComposable({ superheroApiUrl: 'https://api.test/' });

    await composable.linkPreferredAensName('ak_test', 'name.chain');

    expect(postJson).toHaveBeenNthCalledWith(1, `https://api.test${BASE_PATH}/claim`, expect.anything());
  });

  it('throws when the Superhero API URL is not configured for the network', async () => {
    const { composable, postJson } = await loadComposable({ superheroApiUrl: undefined });

    await expect(composable.linkPreferredAensName('ak_test', 'name.chain')).rejects.toThrow();
    expect(postJson).not.toHaveBeenCalled();
  });
});
