// @ts-nocheck
const ACCOUNT = 'ak_account';
const OTHER = 'ak_other';
const PAIR = 'ak_pair';
/** Mints are sent by the token contract */
const TOKEN_AS_SENDER = 'ak_token';
const TOKEN = 'ct_token';
const DAO_TOKEN = 'ct_daoToken';
const TOKEN_SALE = 'ct_tokenSale';

const BUY_HASH = 'th_buy';
const BATCH_HASH = 'th_batch';
const RECEIVED_HASH = 'th_received';
const ALLOWANCE_HASH = 'th_allowance';
const OLD_HASH = 'th_old';
const MULTI_HASH = 'th_multi';
const TOKEN_CALL_HASH = 'th_tokenCall';
const NEXT_PAGE = `/v3/aex9/${TOKEN}/transfers?account=${ACCOUNT}&cursor=next&limit=10`;

/** A row of `/v3/aex9/{contract_id}/transfers` */
function transferRow(txHash, sender, recipient, amount, logIdx = 0) {
  return {
    amount,
    block_height: 10,
    contract_id: TOKEN,
    log_idx: logIdx,
    micro_index: 1,
    micro_time: 1000,
    recipient,
    sender,
    tx_hash: txHash,
  };
}

/** The events below are shaped as `/v2/accounts/{id}/activities` lists them */
function transferEvent(txHash, sender, recipient, amount, contractId = TOKEN) {
  return {
    type: 'Aex9TransferEvent',
    payload: {
      amount,
      block_height: 10,
      contract_id: contractId,
      log_idx: 0,
      micro_index: 1,
      micro_time: 1000,
      recipient_id: recipient,
      sender_id: sender,
      token_symbol: contractId === TOKEN ? 'TKN' : 'DAO',
      tx_hash: txHash,
    },
  };
}

function callEvent(hash, callerId, fn, args, tx = {}) {
  return {
    type: 'ContractCallTxEvent',
    payload: {
      block_height: 10,
      hash,
      micro_index: 1,
      micro_time: 2000,
      tx: {
        arguments: args,
        caller_id: callerId,
        contract_id: TOKEN,
        function: fn,
        return_type: 'ok',
        type: 'ContractCallTx',
        ...tx,
      },
    },
  };
}

function refundEvent(callTxHash, recipient, amount) {
  return {
    type: 'InternalContractCallEvent',
    payload: {
      call_tx_hash: callTxHash,
      contract_id: 'ct_factory',
      function: 'Chain.spend',
      internal_tx: {
        amount, recipient_id: recipient, sender_id: 'ak_tokenSale', type: 'SpendTx',
      },
    },
  };
}

/** Internal transfers of the generation come along with the events of a transaction */
function internalTransferEvent(refTxHash) {
  return {
    type: 'InternalTransferEvent',
    payload: { amount: 1, kind: 'fee_lock_name', ref_tx_hash: refTxHash },
  };
}

function jsonResponse(body, status = 200) {
  return {
    ok: status < 400,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

/** What the fake middleware serves */
let mdw;

describe('AeternityAdapter token transactions', () => {
  beforeEach(async () => {
    vi.resetModules();
    mdw = {
      version: '1.110.0',
      failingHashes: [],
      transferPages: {
        [ACCOUNT]: {
          first: {
            data: [
              // An own token sale buy mints the token to the account
              transferRow(BUY_HASH, TOKEN_AS_SENDER, ACCOUNT, 4976, 5),
              transferRow(BATCH_HASH, ACCOUNT, OTHER, 3, 1),
              transferRow(BATCH_HASH, ACCOUNT, PAIR, 4, 0),
              transferRow(RECEIVED_HASH, OTHER, ACCOUNT, 5),
              // Another account spends the tokens of the account
              transferRow(ALLOWANCE_HASH, ACCOUNT, PAIR, 7),
            ],
            next: NEXT_PAGE,
          },
          next: {
            data: [transferRow(OLD_HASH, OTHER, ACCOUNT, 1)],
            next: null,
          },
        },
      },
      transactionActivities: {
        [ACCOUNT]: {
          [BUY_HASH]: [
            transferEvent(BUY_HASH, TOKEN_AS_SENDER, ACCOUNT, 4976),
            transferEvent(BUY_HASH, 'ak_daoToken', ACCOUNT, 501, DAO_TOKEN),
            callEvent(
              BUY_HASH,
              ACCOUNT,
              'buy',
              [{ type: 'int', value: 4976 }],
              { amount: 5066, contract_id: TOKEN_SALE },
            ),
            refundEvent(BUY_HASH, ACCOUNT, 50),
            internalTransferEvent('th_another'),
          ],
          [BATCH_HASH]: [
            transferEvent(BATCH_HASH, ACCOUNT, OTHER, 3),
            transferEvent(BATCH_HASH, ACCOUNT, PAIR, 4),
            callEvent(BATCH_HASH, ACCOUNT, 'send_all', [], { contract_id: 'ct_batch' }),
          ],
          [RECEIVED_HASH]: [transferEvent(RECEIVED_HASH, OTHER, ACCOUNT, 5)],
          [ALLOWANCE_HASH]: [transferEvent(ALLOWANCE_HASH, ACCOUNT, PAIR, 7)],
          [OLD_HASH]: [transferEvent(OLD_HASH, OTHER, ACCOUNT, 1)],
        },
      },
      accountActivities: {
        data: [
          callEvent(TOKEN_CALL_HASH, ACCOUNT, 'transfer', [
            { type: 'address', value: OTHER },
            { type: 'int', value: 2 },
          ]),
          {
            type: 'SpendTxEvent',
            payload: {
              hash: 'th_spend',
              micro_time: 1500,
              tx: {
                amount: 1, recipient_id: OTHER, sender_id: ACCOUNT, type: 'SpendTx',
              },
            },
          },
        ],
        next: null,
      },
    };
    vi.doMock('@/composables/aeSdk', () => ({
      useAeSdk: () => ({
        getAeSdk: async () => ({}),
        setAeNodeError: vi.fn(),
      }),
    }));
    await import('@/protocols/registerAdapters');
    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      const { pathname, searchParams } = new URL(url);
      const path = pathname.replace(/^\/mdw/, '');
      if (path === '/v3/status') {
        return jsonResponse({ mdw_version: mdw.version });
      }
      if (path === `/v3/aex9/${TOKEN}/transfers`) {
        const page = mdw.transferPages[searchParams.get('account')]
          ?.[searchParams.get('cursor') || 'first'];
        if (page) return jsonResponse(page);
      }
      const [, account] = path.match(/^\/v2\/accounts\/([^/]+)\/activities$/) || [];
      const scope = searchParams.get('scope');
      if (account && !scope) {
        return jsonResponse(mdw.accountActivities);
      }
      const hash = scope?.replace('transaction:', '');
      const data = mdw.transactionActivities[account]?.[hash];
      if (data && !mdw.failingHashes.includes(hash)) {
        return jsonResponse({ data, next: null, prev: null });
      }
      return jsonResponse({ error: 'not found' }, 404);
    });
  });

  afterEach(() => {
    vi.doUnmock('@/composables/aeSdk');
    vi.restoreAllMocks();
  });

  async function getAdapter() {
    const { AeternityAdapter } = await import('@/protocols/aeternity/libs/AeternityAdapter');
    const adapter = new AeternityAdapter();
    vi.spyOn(adapter, 'fetchPendingTransactions').mockResolvedValue([]);
    return adapter;
  }

  async function getDirection(transaction) {
    const { getTxDirection } = await import('@/protocols/aeternity/helpers');
    return getTxDirection(transaction.tx, ACCOUNT);
  }

  async function silenceErrorLog() {
    const { default: Logger } = await import('@/lib/logger');
    vi.spyOn(Logger, 'write').mockResolvedValue(undefined);
  }

  function requestedPaths() {
    return global.fetch.mock.calls.map(([url]) => {
      const { pathname, search } = new URL(url);
      return pathname.replace(/^\/mdw/, '') + search;
    });
  }

  function eventRequests() {
    return requestedPaths().filter((path) => path.includes('scope=transaction:'));
  }

  function eventRequest(account, hash) {
    return `/v2/accounts/${account}/activities?scope=transaction:${hash}&limit=100`;
  }

  function getHashes(transactions) {
    return transactions.map(({ hash }) => hash);
  }

  function getTransaction(transactions, hash) {
    const matching = transactions.filter((transaction) => transaction.hash === hash);
    expect(matching).toHaveLength(1);
    return matching[0];
  }

  it('reads the first page of the token transfers of the account, then the page it is given', async () => {
    const adapter = await getAdapter();

    const first = await adapter.fetchAccountAssetTransactions(ACCOUNT, TOKEN);
    const second = await adapter.fetchAccountAssetTransactions(
      ACCOUNT,
      TOKEN,
      first.paginationParams,
    );

    expect(requestedPaths().filter((path) => path.includes('/transfers'))).toEqual([
      `/v3/aex9/${TOKEN}/transfers?account=${ACCOUNT}&limit=10`,
      NEXT_PAGE,
    ]);
    expect(first.paginationParams).toEqual({ nextPageUrl: NEXT_PAGE });
    expect(getHashes(first.regularTransactions))
      .toEqual([BUY_HASH, BATCH_HASH, RECEIVED_HASH, ALLOWANCE_HASH]);
    expect(second.paginationParams).toEqual({});
    expect(getHashes(second.regularTransactions)).toEqual([OLD_HASH]);
  });

  it('shows an own token sale buy with the other token and the refund of the transaction', async () => {
    const adapter = await getAdapter();
    const { getTransactionTokenInfoResolver } = await import('@/protocols/aeternity/helpers');

    const { regularTransactions } = await adapter.fetchAccountAssetTransactions(ACCOUNT, TOKEN);
    const buy = getTransaction(regularTransactions, BUY_HASH);

    expect(buy.incomplete).toBeUndefined();
    expect(buy.tx.function).toBe('buy');
    const { tokens } = getTransactionTokenInfoResolver('buy')(buy, {}, () => TOKEN);
    expect(tokens.map(({ contractId, amount, isReceived }) => ({ contractId, amount, isReceived })))
      .toEqual([
        { contractId: TOKEN, amount: 4976, isReceived: true },
        { contractId: DAO_TOKEN, amount: 501, isReceived: true },
        { contractId: 'aeternity', amount: 5016, isReceived: false },
      ]);
  });

  it('shows the transfers of an own transaction as one transaction', async () => {
    const adapter = await getAdapter();

    const { regularTransactions } = await adapter.fetchAccountAssetTransactions(ACCOUNT, TOKEN);
    const batch = getTransaction(regularTransactions, BATCH_HASH);

    expect(batch.incomplete).toBeUndefined();
    expect(batch.tx.function).toBe('send_all');
    expect(batch.tx.internalEvents.map(({ payload }) => payload.recipientId))
      .toEqual([OTHER, PAIR]);
  });

  it('shows the transactions of others by the tokens they moved', async () => {
    const adapter = await getAdapter();

    const { regularTransactions } = await adapter.fetchAccountAssetTransactions(ACCOUNT, TOKEN);
    const received = getTransaction(regularTransactions, RECEIVED_HASH);
    const spent = getTransaction(regularTransactions, ALLOWANCE_HASH);

    expect(received).toEqual(expect.objectContaining({
      incomplete: true,
      transactionOwner: ACCOUNT,
      microTime: 1000,
    }));
    expect(received.tx).toEqual(expect.objectContaining({
      amount: 5,
      contractId: TOKEN,
      recipientId: ACCOUNT,
      senderId: OTHER,
      type: 'ContractCallTx',
    }));
    expect(await getDirection(received)).toBe('received');
    expect(spent.incomplete).toBe(true);
    expect(spent.tx.amount).toBe(7);
    expect(await getDirection(spent)).toBe('sent');
  });

  it.each([
    ['the sum of the received tokens', [[OTHER, ACCOUNT, 5], [OTHER, ACCOUNT, 3]], 8, 'received'],
    ['the received tokens less the sent ones', [[OTHER, ACCOUNT, 5], [ACCOUNT, PAIR, 2]], 3, 'received'],
    ['the sent tokens less the received ones', [[OTHER, ACCOUNT, 2], [ACCOUNT, PAIR, 5]], 3, 'sent'],
    ['the burnt tokens', [[ACCOUNT, null, 2]], 2, 'sent'],
  ])('shows the transfers of others in a transaction by %s', async (_, transfers, amount, direction) => {
    mdw.transferPages[ACCOUNT] = {
      first: {
        data: transfers.map(([sender, recipient, value], index) => (
          transferRow(MULTI_HASH, sender, recipient, value, index)
        )),
        next: null,
      },
    };
    mdw.transactionActivities[ACCOUNT] = {
      [MULTI_HASH]: transfers.map(([sender, recipient, value]) => (
        transferEvent(MULTI_HASH, sender, recipient, value)
      )),
    };
    const adapter = await getAdapter();

    const { regularTransactions } = await adapter.fetchAccountAssetTransactions(ACCOUNT, TOKEN);

    expect(getHashes(regularTransactions)).toEqual([MULTI_HASH]);
    expect(regularTransactions[0].incomplete).toBe(true);
    expect(regularTransactions[0].tx.amount).toBe(amount);
    expect(await getDirection(regularTransactions[0])).toBe(direction);
  });

  it('leaves out transfers of others that give the account nothing', async () => {
    mdw.transferPages[ACCOUNT].first.data = [
      transferRow(MULTI_HASH, OTHER, ACCOUNT, 4, 1),
      transferRow(MULTI_HASH, ACCOUNT, PAIR, 4, 0),
    ];
    mdw.transactionActivities[ACCOUNT][MULTI_HASH] = [
      transferEvent(MULTI_HASH, OTHER, ACCOUNT, 4),
      transferEvent(MULTI_HASH, ACCOUNT, PAIR, 4),
    ];
    const adapter = await getAdapter();

    const { regularTransactions } = await adapter.fetchAccountAssetTransactions(ACCOUNT, TOKEN);

    expect(regularTransactions).toEqual([]);
  });

  it('reads the events of a transaction once for each account', async () => {
    mdw.transferPages[OTHER] = {
      first: { data: [transferRow(RECEIVED_HASH, OTHER, ACCOUNT, 5)], next: null },
    };
    mdw.transactionActivities[OTHER] = {
      [RECEIVED_HASH]: [
        transferEvent(RECEIVED_HASH, OTHER, ACCOUNT, 5),
        callEvent(RECEIVED_HASH, OTHER, 'transfer', []),
      ],
    };
    const adapter = await getAdapter();

    await adapter.fetchAccountAssetTransactions(ACCOUNT, TOKEN);
    // Polling the first page
    await adapter.fetchAccountAssetTransactions(ACCOUNT, TOKEN);
    await adapter.fetchAccountAssetTransactions(OTHER, TOKEN);

    expect(eventRequests().sort()).toEqual([
      eventRequest(ACCOUNT, BUY_HASH),
      eventRequest(ACCOUNT, BATCH_HASH),
      eventRequest(ACCOUNT, RECEIVED_HASH),
      eventRequest(ACCOUNT, ALLOWANCE_HASH),
      eventRequest(OTHER, RECEIVED_HASH),
    ].sort());
  });

  it('rejects when the events of a transaction fail to load', async () => {
    mdw.failingHashes = [RECEIVED_HASH];
    const adapter = await getAdapter();
    await silenceErrorLog();

    await expect(adapter.fetchAccountAssetTransactions(ACCOUNT, TOKEN)).rejects.toThrow('HTTP 404');
  });

  it('keeps the token in the path of the request', async () => {
    const contractId = `ct_x/transfers?account=${OTHER}&limit=10#`;
    const adapter = await getAdapter();
    await silenceErrorLog();

    await expect(adapter.fetchAccountAssetTransactions(ACCOUNT, contractId)).rejects.toThrow();

    expect(requestedPaths()).toContain(
      `/v3/aex9/${encodeURIComponent(contractId)}/transfers?account=${ACCOUNT}&limit=10`,
    );
  });

  it.each(['1.108.0', '1.66.0', '', 'unknown'])('filters the account activities for a token on mdw "%s"', async (version) => {
    mdw.version = version;
    const adapter = await getAdapter();

    const { regularTransactions } = await adapter.fetchAccountAssetTransactions(ACCOUNT, TOKEN);

    expect(requestedPaths()).toEqual(['/v3/status', `/v2/accounts/${ACCOUNT}/activities?limit=30`]);
    expect(getHashes(regularTransactions)).toEqual([TOKEN_CALL_HASH]);
  });

  it.each(['1.109.0', '2.0.0'])('reads the token transfers on mdw %s', async (version) => {
    mdw.version = version;
    const adapter = await getAdapter();

    await adapter.fetchAccountAssetTransactions(ACCOUNT, TOKEN);

    expect(requestedPaths()).toContain(`/v3/aex9/${TOKEN}/transfers?account=${ACCOUNT}&limit=10`);
    expect(requestedPaths()).not.toContain(`/v2/accounts/${ACCOUNT}/activities?limit=30`);
  });

  it('asks the middleware for its version once', async () => {
    const adapter = await getAdapter();

    await adapter.fetchAccountAssetTransactions(ACCOUNT, TOKEN);
    await adapter.fetchAccountAssetTransactions(ACCOUNT, TOKEN);

    expect(requestedPaths().filter((path) => path === '/v3/status')).toHaveLength(1);
  });

  it('asks the middleware for its version again when it failed to answer', async () => {
    const adapter = await getAdapter();
    await silenceErrorLog();
    global.fetch.mockResolvedValueOnce(jsonResponse({ error: 'unavailable' }, 503));

    await expect(adapter.fetchAccountAssetTransactions(ACCOUNT, TOKEN)).rejects.toThrow('HTTP 503');
    await adapter.fetchAccountAssetTransactions(ACCOUNT, TOKEN);

    expect(requestedPaths().filter((path) => path === '/v3/status')).toHaveLength(2);
    expect(requestedPaths()).toContain(`/v3/aex9/${TOKEN}/transfers?account=${ACCOUNT}&limit=10`);
  });

  it('continues a token list loaded from the account activities from them', async () => {
    const nextPageUrl = `/v2/accounts/${ACCOUNT}/activities?cursor=next&limit=30`;
    const adapter = await getAdapter();

    const { regularTransactions } = await adapter.fetchAccountAssetTransactions(
      ACCOUNT,
      TOKEN,
      { nextPageUrl },
    );

    expect(requestedPaths()).toEqual([nextPageUrl]);
    expect(getHashes(regularTransactions)).toEqual([TOKEN_CALL_HASH]);
  });

  it('keeps filtering the account activities for the AE coin', async () => {
    const adapter = await getAdapter();

    const { regularTransactions } = await adapter.fetchAccountAssetTransactions(
      ACCOUNT,
      adapter.coinContractId,
    );

    expect(requestedPaths()).toEqual([`/v2/accounts/${ACCOUNT}/activities?limit=30`]);
    expect(getHashes(regularTransactions)).toEqual(['th_spend']);
  });
});
