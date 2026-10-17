import type { ITransaction } from '@/types';
import { TX_DIRECTION } from '@/constants';
import { getTxDirection } from '@/protocols/aeternity/helpers';
import { BitcoinAdapter } from '@/protocols/bitcoin/libs/BitcoinAdapter';
import transactions from '../../../fixtures/bitcoinTransactions.json';

/**
 * Real mainnet transactions from block 971698, exactly as Blockstream's
 * `/address/:address/txs` returns them. Only `fetch` is mocked.
 */
type EsploraTransaction = (typeof transactions)[keyof typeof transactions];

const { changeToOtherInput, plainIncoming } = transactions;

/** Not on chain: the inputs of `changeToOtherInput` paid to its second input address. */
const consolidation = {
  ...changeToOtherInput,
  vout: [{ ...changeToOtherInput.vout[1], value: 659152 + 600000000 - 745 }],
};

/** Not on chain: `plainIncoming` paid in two outputs to the same address. */
const incomingInTwoOutputs = {
  ...plainIncoming,
  vout: [
    { ...plainIncoming.vout[0], value: 300000 },
    { ...plainIncoming.vout[0], value: 65355 },
  ],
};

const originalFetch = global.fetch;

function mockEsplora(owner: string, tx: EsploraTransaction) {
  global.fetch = vi.fn(async (url: string) => {
    const { pathname } = new URL(url);
    if (pathname.endsWith(`/address/${owner}/txs`)) {
      return Response.json([tx]);
    }
    if (pathname.endsWith(`/tx/${tx.txid}`)) {
      return Response.json(tx);
    }
    throw new Error(`Unexpected request: ${url}`);
  }) as any;
}

function summarize(transaction: ITransaction) {
  return {
    amount: transaction.tx.amount,
    fee: transaction.tx.fee,
    senderId: transaction.tx.senderId,
    recipientId: transaction.tx.recipientId,
    direction: getTxDirection(transaction.tx, transaction.transactionOwner),
  };
}

const CASES = [
  {
    title: 'an exchange batch payout to the owner at the third output',
    tx: transactions.batchPayout,
    owner: 'bc1qtpzw6e9d4yn7p44fcf5d2qmja6ql0vh279mttm',
    expected: {
      amount: 0.00276939,
      fee: 0.00000468,
      senderId: 'bc1qf43tdrym26qlz8rg06f88wg35n27uhcf29zs4f',
      recipientId: 'bc1qtpzw6e9d4yn7p44fcf5d2qmja6ql0vh279mttm',
      direction: TX_DIRECTION.received,
    },
  },
  {
    title: 'a payment with another input address, which takes the change',
    tx: changeToOtherInput,
    owner: 'bc1qr94ymcy2vj8vpppwrv5vztfwzl8aencqul3jlf',
    expected: {
      // All of its 0.00659152 input, less the fee
      amount: 0.00658407,
      fee: 0.00000745,
      senderId: 'bc1qr94ymcy2vj8vpppwrv5vztfwzl8aencqul3jlf',
      recipientId: 'bc1qcnfwq0fskzawd256y9cantsmxffhzff5h30yyx',
      direction: TX_DIRECTION.sent,
    },
  },
  {
    title: 'a payment with another input address, from the one that takes the change',
    tx: changeToOtherInput,
    owner: 'bc1q7e7j5u8rk6we50j2y4vgxnnqq8jwc7xsssws7q',
    expected: {
      // 6 BTC in, 5.98973499 back, less the fee
      amount: 0.01025756,
      fee: 0.00000745,
      senderId: 'bc1q7e7j5u8rk6we50j2y4vgxnnqq8jwc7xsssws7q',
      recipientId: 'bc1qcnfwq0fskzawd256y9cantsmxffhzff5h30yyx',
      direction: TX_DIRECTION.sent,
    },
  },
  {
    title: 'a consolidation into another input address',
    tx: consolidation,
    owner: 'bc1qr94ymcy2vj8vpppwrv5vztfwzl8aencqul3jlf',
    expected: {
      amount: 0.00658407,
      fee: 0.00000745,
      senderId: 'bc1qr94ymcy2vj8vpppwrv5vztfwzl8aencqul3jlf',
      recipientId: 'bc1q7e7j5u8rk6we50j2y4vgxnnqq8jwc7xsssws7q',
      direction: TX_DIRECTION.sent,
    },
  },
  {
    title: 'a payment whose change goes back to the owner',
    tx: transactions.changeToSameAddress,
    owner: 'bc1qryhgpmfv03qjhhp2dj8nw8g4ewg08jzmgy3cyx',
    expected: {
      amount: 0.00229379,
      fee: 0.00002115,
      senderId: 'bc1qryhgpmfv03qjhhp2dj8nw8g4ewg08jzmgy3cyx',
      recipientId: 'bc1qt2l59fglswnq272t7tyfyup82ferxtcfv8hlj9',
      direction: TX_DIRECTION.sent,
    },
  },
  {
    title: 'a payment with an OP_RETURN output',
    tx: transactions.opReturn,
    owner: 'bc1q5fekm602mmlwxg9xepfa565lm7nh07v7tymg02',
    expected: {
      amount: 0.0003,
      fee: 0.00000483,
      senderId: 'bc1q5fekm602mmlwxg9xepfa565lm7nh07v7tymg02',
      recipientId: 'bc1qmjn5qk3u6ha254z94hy7spd7dd64ws4pd927nn',
      direction: TX_DIRECTION.sent,
    },
  },
  {
    title: 'a payment where the owner is the second input and gets more back',
    tx: transactions.ownerIsSecondInput,
    owner: 'bc1qtu7ehp0suudwhwz8wuycg9ju6ythq4zmh7e2sf',
    expected: {
      // 0.00157423 in, 0.02213054 back
      amount: 0.02055631,
      fee: 0.00000465,
      senderId: 'bc1qgs8y55ysreemjs4ujfclelwr595ttfrjyzpvmy',
      recipientId: 'bc1qtu7ehp0suudwhwz8wuycg9ju6ythq4zmh7e2sf',
      direction: TX_DIRECTION.received,
    },
  },
  {
    title: 'a self-send of the first output, with the change in the second',
    tx: transactions.selfSend,
    owner: 'bc1p397yhgf3pzay7cn2q39ggnhkqxwuw7g3vfzwh5ftl6nccvy3w04sh2hkkv',
    expected: {
      amount: 0.00000546,
      fee: 0.00000212,
      senderId: 'bc1p397yhgf3pzay7cn2q39ggnhkqxwuw7g3vfzwh5ftl6nccvy3w04sh2hkkv',
      recipientId: 'bc1p397yhgf3pzay7cn2q39ggnhkqxwuw7g3vfzwh5ftl6nccvy3w04sh2hkkv',
      direction: TX_DIRECTION.sent,
    },
  },
  {
    title: 'a plain single-output incoming transfer',
    tx: plainIncoming,
    owner: 'bc1q99g364vzshmzm7celpn9cp6qup58dhgcd40jq9',
    expected: {
      amount: 0.00365355,
      fee: 0.00042482,
      senderId: 'bc1qf6cpe854aue7yz2mshm9vcd689j6jjq6pdjkdp',
      recipientId: 'bc1q99g364vzshmzm7celpn9cp6qup58dhgcd40jq9',
      direction: TX_DIRECTION.received,
    },
  },
  {
    title: 'an incoming transfer in two outputs to the owner',
    tx: incomingInTwoOutputs,
    owner: 'bc1q99g364vzshmzm7celpn9cp6qup58dhgcd40jq9',
    expected: {
      amount: 0.00365355,
      fee: 0.00042482,
      senderId: 'bc1qf6cpe854aue7yz2mshm9vcd689j6jjq6pdjkdp',
      recipientId: 'bc1q99g364vzshmzm7celpn9cp6qup58dhgcd40jq9',
      direction: TX_DIRECTION.received,
    },
  },
  {
    title: 'a coinbase payout',
    tx: transactions.coinbase,
    owner: '1PuJjnF476W3zXfVYmJfGnouzFDAXakkL4',
    expected: {
      amount: 3.14453299,
      fee: 0,
      senderId: undefined,
      recipientId: '1PuJjnF476W3zXfVYmJfGnouzFDAXakkL4',
      direction: TX_DIRECTION.received,
    },
  },
];

describe('BitcoinAdapter - transaction amount and counterparty', () => {
  const adapter = new BitcoinAdapter();

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe.each([
    {
      method: 'fetchAccountTransactions',
      load: async (owner: string) => (
        await adapter.fetchAccountTransactions(owner)
      ).regularTransactions[0],
    },
    {
      method: 'fetchTransactionByHash',
      load: (owner: string, tx: EsploraTransaction) => adapter.fetchTransactionByHash(
        tx.txid,
        owner,
      ),
    },
  ])('$method', ({ load }) => {
    it.each(CASES)('shows $title from the owner\'s side', async ({ tx, owner, expected }) => {
      mockEsplora(owner, tx);

      expect(summarize(await load(owner, tx))).toEqual(expected);
    });
  });

  it('reads a transaction from its first input\'s side when no owner is given', async () => {
    const tx = changeToOtherInput;
    mockEsplora('', tx);

    const { tx: { amount, senderId, recipientId } } = await adapter.fetchTransactionByHash(tx.txid);
    expect({ amount, senderId, recipientId }).toEqual({
      amount: 0.00658407,
      senderId: 'bc1qr94ymcy2vj8vpppwrv5vztfwzl8aencqul3jlf',
      recipientId: 'bc1qcnfwq0fskzawd256y9cantsmxffhzff5h30yyx',
    });
  });
});
