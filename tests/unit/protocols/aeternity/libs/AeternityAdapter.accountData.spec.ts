// @ts-nocheck
/**
 * The account data the adapter reads from the middleware v3.
 */
const ACCOUNT = 'ak_account';
const CONTRACT_CALL_HASH = 'th_contractCall';

function jsonResponse(body, status = 200) {
  return {
    ok: status < 400,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function spend(hash) {
  return {
    type: 'SpendTxEvent',
    payload: {
      hash,
      micro_time: 1,
      tx: {
        amount: 1, recipient_id: ACCOUNT, sender_id: 'ak_other', type: 'SpendTx',
      },
    },
  };
}

function contractCallEvent(type, payload) {
  return { type, payload: { tx_hash: CONTRACT_CALL_HASH, ...payload } };
}

let responses;

describe('AeternityAdapter account data', () => {
  beforeEach(async () => {
    vi.resetModules();
    responses = {};
    vi.doMock('@/composables/aeSdk', () => ({
      useAeSdk: () => ({
        getAeSdk: async () => ({
          api: { getPendingAccountTransactionsByPubkey: async () => ({ transactions: [] }) },
        }),
        setAeNodeError: vi.fn(),
      }),
    }));
    await import('@/protocols/registerAdapters');
    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      const { pathname, search } = new URL(url);
      const path = pathname.replace(/^\/mdw/, '') + search;
      return responses[path] ?? jsonResponse({ error: 'not found' }, 404);
    });
  });

  afterEach(() => {
    vi.doUnmock('@/composables/aeSdk');
    vi.restoreAllMocks();
  });

  async function getAdapter() {
    const { AeternityAdapter } = await import('@/protocols/aeternity/libs/AeternityAdapter');
    return new AeternityAdapter();
  }

  function requestedPaths() {
    return global.fetch.mock.calls
      .map(([url]) => new URL(url))
      .filter(({ hostname }) => hostname.endsWith('aeternity.io'))
      .map(({ pathname, search }) => pathname.replace(/^\/mdw/, '') + search);
  }

  describe('fetchAccountTransactions', () => {
    it('reads a page of the account activities', async () => {
      responses[`/v3/accounts/${ACCOUNT}/activities?limit=30`] = jsonResponse({
        data: [spend('th_spend')],
        next: `/v3/accounts/${ACCOUNT}/activities?cursor=c1&limit=30`,
      });
      const adapter = await getAdapter();

      const { regularTransactions, paginationParams } = await adapter
        .fetchAccountTransactions(ACCOUNT);

      expect(regularTransactions.map(({ hash }) => hash)).toEqual(['th_spend']);
      expect(paginationParams).toEqual({
        nextPageUrl: `/v3/accounts/${ACCOUNT}/activities?cursor=c1&limit=30`,
      });
    });

    it('completes a contract call whose events continue on the next page', async () => {
      responses[`/v3/accounts/${ACCOUNT}/activities?limit=30`] = jsonResponse({
        data: [
          spend('th_spend'),
          {
            type: 'ContractCallTxEvent',
            payload: {
              hash: CONTRACT_CALL_HASH,
              tx: {
                caller_id: ACCOUNT, contract_id: 'ct_router', function: 'swap', type: 'ContractCallTx',
              },
            },
          },
        ],
        next: `/v3/accounts/${ACCOUNT}/activities?cursor=c%2F1&limit=30`,
      });
      responses[`/v3/accounts/${ACCOUNT}/activities?cursor=c%2F1&limit=5`] = jsonResponse({
        data: [
          contractCallEvent('Aex9TransferEvent', {
            amount: 7, contract_id: 'ct_token', recipient_id: ACCOUNT, sender_id: 'ak_pair',
          }),
          spend('th_older'),
        ],
        next: null,
      });
      const adapter = await getAdapter();

      const { regularTransactions, paginationParams } = await adapter
        .fetchAccountTransactions(ACCOUNT);

      expect(regularTransactions.map(({ hash }) => hash)).toEqual(['th_spend', CONTRACT_CALL_HASH]);
      expect(regularTransactions[1].tx.internalEvents).toEqual([
        expect.objectContaining({ type: 'Aex9TransferEvent' }),
      ]);
      // The next page starts where it did, the events are just read ahead
      expect(paginationParams.nextPageUrl)
        .toBe(`/v3/accounts/${ACCOUNT}/activities?cursor=c%2F1&limit=30`);
    });
  });

  it('reads every page of the token balances of the account', async () => {
    const balance = (contractId, amount) => ({
      amount,
      contract_id: contractId,
      decimals: 18,
      token_name: contractId,
      token_symbol: contractId,
    });
    responses[`/v3/accounts/${ACCOUNT}/aex9/balances?limit=100`] = jsonResponse({
      data: [balance('ct_a', 1500000000000000000)],
      next: `/v3/accounts/${ACCOUNT}/aex9/balances?cursor=c1&limit=100`,
    });
    responses[`/v3/accounts/${ACCOUNT}/aex9/balances?cursor=c1&limit=100`] = jsonResponse({
      data: [balance('ct_b', 2000000000000000000)],
      next: null,
    });
    const adapter = await getAdapter();

    const balances = await adapter.fetchAccountTokenBalances(ACCOUNT);

    expect(balances.map(({ contractId, convertedBalance }) => [contractId, convertedBalance]))
      .toEqual([['ct_a', 1.5], ['ct_b', 2]]);
  });

  describe('fetchTokenInfo', () => {
    it('reads the token from the middleware', async () => {
      responses['/v3/aex9/ct_token'] = jsonResponse({
        contract_id: 'ct_token', decimals: 18, name: 'Token', symbol: 'TKN',
      });
      const adapter = await getAdapter();

      expect(await adapter.fetchTokenInfo('ct_token')).toEqual({
        contractId: 'ct_token', decimals: 18, name: 'Token', symbol: 'TKN',
      });
    });

    it('has no token the middleware does not know', async () => {
      const adapter = await getAdapter();

      expect(await adapter.fetchTokenInfo('ct_unknown')).toBeUndefined();
      expect(requestedPaths()).toEqual(['/v3/aex9/ct_unknown']);
    });
  });

  it('reads a transaction by its hash with its big amounts exact', async () => {
    responses['/v3/transactions/th_1'] = {
      ok: true,
      status: 200,
      text: async () => '{"hash":"th_1","tx":{"amount":1319312684803176974291,"type":"SpendTx"}}',
    };
    const adapter = await getAdapter();

    expect(await adapter.fetchTransactionByHash('th_1', ACCOUNT)).toEqual({
      hash: 'th_1',
      tx: { amount: '1319312684803176974291', type: 'SpendTx' },
      protocol: 'aeternity',
      transactionOwner: ACCOUNT,
    });
  });
});
