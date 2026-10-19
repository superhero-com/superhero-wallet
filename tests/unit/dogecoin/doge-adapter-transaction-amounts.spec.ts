import { TX_DIRECTION } from '@/constants';
import { getTxDirection } from '@/protocols/aeternity/helpers';
import { DogecoinAdapter } from '@/protocols/dogecoin/libs/DogecoinAdapter';
import transactions from '../../fixtures/dogecoinTransactions.json';

/**
 * A real mainnet batch payout (block 6417446) in the esplora shape that the
 * Dogecoin electrs `/address/:address/txs` endpoint returns. Only `fetch` is mocked.
 */
const tx = transactions.batchPayout;
const originalFetch = global.fetch;

describe('DogecoinAdapter - transaction amount and counterparty', () => {
  const adapter = new DogecoinAdapter();

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it.each([
    {
      title: 'a payout recipient at the third output',
      owner: 'DMy9mfDFm99D8rdrEJFgf8ENivnmDhM2s5',
      expected: {
        amount: 294.276,
        fee: 0.0329,
        senderId: 'D9tphtowQ6Q9Nj9WYhEsXcQbcuMuUVVNek',
        recipientId: 'DMy9mfDFm99D8rdrEJFgf8ENivnmDhM2s5',
        direction: TX_DIRECTION.received,
      },
    },
    {
      title: 'the payer, whose change returns to its own address',
      owner: 'D9tphtowQ6Q9Nj9WYhEsXcQbcuMuUVVNek',
      expected: {
        amount: 100421.7162641,
        fee: 0.0329,
        senderId: 'D9tphtowQ6Q9Nj9WYhEsXcQbcuMuUVVNek',
        recipientId: 'DS45NRPe85iixiYYzKSD3GE9JVM8LMWkUT',
        direction: TX_DIRECTION.sent,
      },
    },
  ])('shows a batch payout from the side of $title', async ({ owner, expected }) => {
    global.fetch = vi.fn(async (url: string) => {
      if (new URL(url).pathname.endsWith(`/address/${owner}/txs`)) {
        return Response.json([tx]);
      }
      throw new Error(`Unexpected request: ${url}`);
    }) as any;

    const { regularTransactions: [transaction] } = await adapter.fetchAccountTransactions(owner);
    expect({
      amount: transaction.tx.amount,
      fee: transaction.tx.fee,
      senderId: transaction.tx.senderId,
      recipientId: transaction.tx.recipientId,
      direction: getTxDirection(transaction.tx, transaction.transactionOwner),
    }).toEqual(expected);
  });
});
