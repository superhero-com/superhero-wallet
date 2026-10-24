const ADDRESS = 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR';

const nodeError = (statusCode: number) => Object.assign(
  new Error(`node said ${statusCode}`),
  { statusCode },
);

describe('AeternityAdapter - isAccountUsed', () => {
  let getAccountByPubkey: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    getAccountByPubkey = vi.fn();
    vi.doMock('@/composables/aeSdk', () => ({
      useAeSdk: () => ({ getDryAeSdk: async () => ({ api: { getAccountByPubkey } }) }),
    }));
  });

  async function isAccountUsed() {
    const { AeternityAdapter } = await import('@/protocols/aeternity/libs/AeternityAdapter');
    return new AeternityAdapter().isAccountUsed(ADDRESS);
  }

  it('is true for an account the node knows', async () => {
    getAccountByPubkey.mockResolvedValue({ id: ADDRESS });
    await expect(isAccountUsed()).resolves.toBe(true);
    expect(getAccountByPubkey).toHaveBeenCalledWith(ADDRESS);
  });

  it('is false for an account the node has never seen', async () => {
    getAccountByPubkey.mockRejectedValue(nodeError(404));
    await expect(isAccountUsed()).resolves.toBe(false);
  });

  it('fails when the node does not answer, rather than calling the account unused', async () => {
    getAccountByPubkey.mockRejectedValue(nodeError(503));
    await expect(isAccountUsed()).rejects.toThrow('node said 503');
  });
});
