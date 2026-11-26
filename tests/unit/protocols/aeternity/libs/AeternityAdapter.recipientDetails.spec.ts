/**
 * What the transfer review shows about a recipient: the node's account, a vault's consensus,
 * and the times of its first and last sent activity from the middleware. The node, the contract
 * calls and the middleware are stubbed.
 */
import { Contract, produceNameId } from '@aeternity/aepp-sdk';

const BASIC = 'ak_wTPFpksUJFjjntonTvwK4LJvDw11DPma7kZBneKbumb8yPeFq';
const GENERALIZED = 'ak_2iNDCz2sRLyxrASkGr2TGTqCsFU4crzuhEdRckF8fdqQ7jiwnC';
const CONTRACT = 'ct_azbNZ1XrPjXfqBqbAh1ffLNTQ1sbnuUDFvJrXjYz7JQA1saQ3';
const GA_CONTRACT = 'ct_2iNDCz2sRLyxrASkGr2TGTqCsFU4crzuhEdRckF8fdqQ7jiwnC';
const NAME = 'recipient.chain';
const NAME_ID = produceNameId(NAME);
const CREATED_AT = 1565798572713;
const LAST_SENT_AT = 1795575794289;

const nodeError = (statusCode: number) => Object.assign(
  new Error(`node said ${statusCode}`),
  { statusCode },
);

function jsonResponse(body: any, status = 200) {
  return {
    ok: status < 400,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

const activities = (blockTime?: number) => ({
  data: blockTime === undefined ? [] : [{ type: 'SpendTxEvent', block_time: blockTime }],
  next: null,
  prev: null,
});

describe('AeternityAdapter - fetchRecipientDetails', () => {
  let getAccountByPubkey: ReturnType<typeof vi.fn>;
  let getNameEntryByName: ReturnType<typeof vi.fn>;
  let responses: Record<string, Response>;
  let requestedPaths: string[];

  beforeEach(async () => {
    vi.resetModules();
    getAccountByPubkey = vi.fn();
    getNameEntryByName = vi.fn();
    responses = {};
    requestedPaths = [];
    vi.doMock('@/composables/aeSdk', () => ({
      useAeSdk: () => ({
        getDryAeSdk: async () => ({
          api: { getAccountByPubkey, getNameEntryByName },
          getContext: () => ({}),
        }),
      }),
    }));
    await import('@/protocols/registerAdapters');
    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      const { pathname, search } = new URL(url as string);
      const path = pathname.replace(/^\/mdw/, '') + search;
      requestedPaths.push(path);
      return responses[path] ?? jsonResponse({ error: 'not found' }, 404);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function respondActivities(address: string, first?: number, lastSent?: number) {
    const path = `/v3/accounts/${address}/activities?limit=1&`;
    responses[`${path}direction=forward`] = jsonResponse(activities(first));
    responses[`${path}direction=backward&owned_only=true`] = jsonResponse(activities(lastSent));
  }

  async function fetchRecipientDetails(addressOrName: string) {
    const { AeternityAdapter } = await import('@/protocols/aeternity/libs/AeternityAdapter');
    return new AeternityAdapter().fetchRecipientDetails(addressOrName);
  }

  it('shows a basic account with its balance, creation and last sent transaction', async () => {
    getAccountByPubkey.mockResolvedValue({
      id: BASIC, balance: 1500000000000000000n, nonce: 3, kind: 'basic', payable: true,
    });
    respondActivities(BASIC, CREATED_AT, LAST_SENT_AT);

    await expect(fetchRecipientDetails(BASIC)).resolves.toEqual({
      address: BASIC,
      isUnused: false,
      type: 'basic',
      balance: '1.5',
      createdAt: CREATED_AT,
      lastSentAt: LAST_SENT_AT,
    });
    expect(getAccountByPubkey).toHaveBeenCalledWith(BASIC);
  });

  it('tells a generalized account whose contract is not a multisig vault', async () => {
    getAccountByPubkey.mockResolvedValue({
      id: GENERALIZED,
      balance: 0n,
      nonce: 1,
      kind: 'generalized',
      payable: true,
      contractId: GA_CONTRACT,
    });
    vi.spyOn(Contract, 'initialize').mockResolvedValue({
      get_signers: vi.fn().mockRejectedValue(new Error('Trying to call undefined function')),
      get_consensus_info: vi.fn().mockRejectedValue(new Error('Trying to call undefined function')),
    } as any);
    respondActivities(GENERALIZED, CREATED_AT, LAST_SENT_AT);

    const details = await fetchRecipientDetails(GENERALIZED);

    expect(details).toMatchObject({ type: 'generalized' });
    expect(details!.confirmationsRequired).toBeUndefined();
  });

  it('tells a multisig vault with its consensus', async () => {
    getAccountByPubkey.mockResolvedValue({
      id: GENERALIZED,
      balance: 0n,
      nonce: 1,
      kind: 'generalized',
      payable: true,
      contractId: GA_CONTRACT,
    });
    vi.spyOn(Contract, 'initialize').mockResolvedValue({
      get_signers: vi.fn().mockResolvedValue({ decodedResult: ['ak_signer1', 'ak_signer2', 'ak_signer3'] }),
      get_consensus_info: vi.fn().mockResolvedValue({
        decodedResult: { confirmations_required: 2n, confirmed_by: [], has_consensus: false },
      }),
    } as any);
    respondActivities(GENERALIZED, CREATED_AT, LAST_SENT_AT);

    expect(await fetchRecipientDetails(GENERALIZED)).toMatchObject({
      type: 'multisig', confirmationsRequired: 2, signersCount: 3,
    });
    expect(Contract.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ address: GA_CONTRACT }),
    );
  });

  it('tells a contract, which the node calls a basic account, and skips its sent transactions', async () => {
    getAccountByPubkey.mockResolvedValue({
      id: `ak_${CONTRACT.slice(3)}`, balance: 0n, nonce: 0, kind: 'basic', payable: true,
    });
    respondActivities(CONTRACT, CREATED_AT);

    const details = await fetchRecipientDetails(CONTRACT);

    expect(details).toMatchObject({ address: CONTRACT, type: 'contract', createdAt: CREATED_AT });
    expect(details!.lastSentAt).toBeUndefined();
    expect(requestedPaths.some((path) => path.includes('owned_only'))).toBe(false);
  });

  it('calls an account the node has never seen unused, without asking the middleware', async () => {
    getAccountByPubkey.mockRejectedValue(nodeError(404));

    await expect(fetchRecipientDetails(BASIC)).resolves.toEqual({ address: BASIC, isUnused: true });
    expect(requestedPaths).toEqual([]);
  });

  it('keeps the contract type of an address the node has never seen', async () => {
    getAccountByPubkey.mockRejectedValue(nodeError(404));

    await expect(fetchRecipientDetails(CONTRACT)).resolves.toEqual({
      address: CONTRACT, isUnused: true, type: 'contract',
    });
  });

  it('fails when the node does not answer, rather than calling the account unused', async () => {
    getAccountByPubkey.mockRejectedValue(nodeError(503));

    await expect(fetchRecipientDetails(BASIC)).rejects.toThrow('node said 503');
  });

  it('shows the account a name points to', async () => {
    getNameEntryByName.mockResolvedValue({
      pointers: [{ key: 'account_pubkey', id: BASIC }],
    });
    getAccountByPubkey.mockResolvedValue({
      id: BASIC, balance: 0n, nonce: 0, kind: 'basic', payable: true,
    });
    respondActivities(BASIC, CREATED_AT, LAST_SENT_AT);

    expect(await fetchRecipientDetails(NAME)).toMatchObject({ address: BASIC, type: 'basic' });
    expect(getNameEntryByName).toHaveBeenCalledWith(NAME);
  });

  it('has nothing for a name without an account pointer', async () => {
    getNameEntryByName.mockResolvedValue({ pointers: [] });

    await expect(fetchRecipientDetails(NAME)).resolves.toBeNull();
    expect(getAccountByPubkey).not.toHaveBeenCalled();
  });

  it('shows the unused account a name points to', async () => {
    getNameEntryByName.mockResolvedValue({
      pointers: [{ key: 'account_pubkey', id: BASIC }],
    });
    getAccountByPubkey.mockRejectedValue(nodeError(404));

    await expect(fetchRecipientDetails(NAME)).resolves.toEqual({ address: BASIC, isUnused: true });
  });

  it('shows the account a name id points to, as the node resolves the name', async () => {
    responses[`/v3/names/${NAME_ID}`] = jsonResponse({ name: NAME });
    getNameEntryByName.mockResolvedValue({
      pointers: [{ key: 'account_pubkey', id: BASIC }],
    });
    getAccountByPubkey.mockResolvedValue({
      id: BASIC, balance: 0n, nonce: 0, kind: 'basic', payable: true,
    });
    respondActivities(BASIC, CREATED_AT);

    expect(await fetchRecipientDetails(NAME_ID)).toMatchObject({ address: BASIC, type: 'basic' });
    expect(getNameEntryByName).toHaveBeenCalledWith(NAME);
  });

  it('fails when the middleware gives a name id another name', async () => {
    responses[`/v3/names/${NAME_ID}`] = jsonResponse({ name: 'other.chain' });

    await expect(fetchRecipientDetails(NAME_ID)).rejects.toThrow();
    expect(getNameEntryByName).not.toHaveBeenCalled();
  });

  it('fails when the node does not resolve the name', async () => {
    getNameEntryByName.mockRejectedValue(nodeError(503));

    await expect(fetchRecipientDetails(NAME)).rejects.toThrow('node said 503');
    expect(getAccountByPubkey).not.toHaveBeenCalled();
  });

  it('has nothing for a name the node does not know', async () => {
    getNameEntryByName.mockRejectedValue(nodeError(404));

    await expect(fetchRecipientDetails(NAME)).resolves.toBeNull();
    expect(getAccountByPubkey).not.toHaveBeenCalled();
  });

  it('tells by the nonce that an account has never sent anything', async () => {
    getAccountByPubkey.mockResolvedValue({
      id: BASIC, balance: 0n, nonce: 0, kind: 'basic', payable: true,
    });
    respondActivities(BASIC, CREATED_AT);

    expect(await fetchRecipientDetails(BASIC)).toMatchObject({ lastSentAt: null });
    expect(requestedPaths.some((path) => path.includes('owned_only'))).toBe(false);
  });

  it('leaves the last sent time unknown, not never, when the middleware lags', async () => {
    getAccountByPubkey.mockResolvedValue({
      id: BASIC, balance: 0n, nonce: 5, kind: 'basic', payable: true,
    });
    respondActivities(BASIC, CREATED_AT);

    const details = await fetchRecipientDetails(BASIC);
    expect(details).toMatchObject({ createdAt: CREATED_AT });
    expect(details!.lastSentAt).toBeUndefined();
  });

  it('shows the node account without times when the middleware is down', async () => {
    getAccountByPubkey.mockResolvedValue({
      id: BASIC, balance: 0n, nonce: 5, kind: 'basic', payable: true,
    });
    vi.mocked(global.fetch).mockRejectedValue(new TypeError('Failed to fetch'));

    const details = await fetchRecipientDetails(BASIC);
    expect(details).toMatchObject({ type: 'basic', balance: '0' });
    expect(details!.createdAt).toBeUndefined();
    expect(details!.lastSentAt).toBeUndefined();
  });

  it('has no creation time for an account first seen in the genesis block', async () => {
    getAccountByPubkey.mockResolvedValue({
      id: BASIC, balance: 0n, nonce: 0, kind: 'basic', payable: true,
    });
    respondActivities(BASIC, 0);

    expect((await fetchRecipientDetails(BASIC))!.createdAt).toBeUndefined();
  });

  it('shows the node account alone when the middleware and the vault do not answer in time', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    getAccountByPubkey.mockResolvedValue({
      id: GENERALIZED,
      balance: 0n,
      nonce: 1,
      kind: 'generalized',
      payable: true,
      contractId: GA_CONTRACT,
    });
    vi.spyOn(Contract, 'initialize').mockReturnValue(new Promise(() => {}));
    vi.mocked(global.fetch).mockReturnValue(new Promise(() => {}));

    const details = fetchRecipientDetails(GENERALIZED);
    await vi.waitFor(() => expect(Contract.initialize).toHaveBeenCalled());
    await vi.runAllTimersAsync();

    await expect(details).resolves.toMatchObject({ type: 'generalized', balance: '0' });
    expect((await details)!.createdAt).toBeUndefined();
    expect((await details)!.lastSentAt).toBeUndefined();
  });
});
