/**
 * [BLACK-BOX] The token balance an EVM send can spend leaves out this session's sends of
 * the token that the node hasn't mined, as its balance doesn't reflect them yet. A send
 * the node no longer has doesn't count: the next send takes its nonce.
 */
import BigNumber from 'bignumber.js';

const { node, stateAt, answer } = vi.hoisted(() => {
  const nodeState = {
    balance: '50',
    minedCount: 5,
    /** The nonce the next send gets */
    pendingCount: 10,
    countRequests: 0,
    blockNumber: 100n,
    /** Of the blocks before the latest one */
    pastBlocks: {} as Record<string, { balance: string; minedCount: number }>,
    /** Runs right after the node answers its next request */
    afterAnswer: undefined as (() => void) | undefined,
  };
  return {
    node: nodeState,
    /** The latest block's state by default */
    stateAt: (block?: bigint | string) => nodeState.pastBlocks[String(block)] ?? nodeState,
    answer: <T>(result: T) => {
      const { afterAnswer } = nodeState;
      nodeState.afterAnswer = undefined;
      afterAnswer?.();
      return result;
    },
  };
});

const NODE_URL = 'https://node.example';
const OWNER = '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe';
const TOKEN = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
const OTHER = '0x0000000000000000000000000000000000000004';

vi.mock('@/protocols/ethereum/helpers', () => ({
  getTokenBalance: async (contractId: string, owner: string, nodeUrl: string, block?: bigint) => (
    answer(new BigNumber(stateAt(block).balance))
  ),
}));

vi.mock('web3-eth', () => ({
  // vitest constructs this directly (`new Web3Eth(...)`), which throws on an arrow fn.
  // eslint-disable-next-line prefer-arrow-callback
  Web3Eth: function Web3Eth() {
    return {
      getBlockNumber: async () => {
        node.countRequests += 1;
        return answer(node.blockNumber);
      },
      getTransactionCount: async (address: string, block: bigint | 'pending') => {
        node.countRequests += 1;
        return answer(BigInt(block === 'pending' ? node.pendingCount : stateAt(block).minedCount));
      },
    };
  },
}));

/** A fresh session, without the sends of other tests */
async function loadComposable() {
  vi.resetModules();
  const { useEthTokenBalance } = await import('@/protocols/ethereum/composables/ethTokenBalance');
  return useEthTokenBalance();
}

function send(nonce: number, amount: string, overrides = {}) {
  return {
    nodeUrl: NODE_URL,
    from: OWNER,
    contractId: TOKEN,
    nonce,
    amount,
    ...overrides,
  };
}

beforeEach(() => {
  node.balance = '50';
  node.minedCount = 5;
  node.pendingCount = 10;
  node.countRequests = 0;
  node.blockNumber = 100n;
  node.pastBlocks = {};
  node.afterAnswer = undefined;
});

describe('useEthTokenBalance - spendable token balance', () => {
  it('is the node balance without sends', async () => {
    const { getSpendableTokenBalance } = await loadComposable();

    expect((await getSpendableTokenBalance(TOKEN, OWNER, NODE_URL)).toFixed()).toBe('50');
    expect(node.countRequests).toBe(0);
  });

  it('leaves out sends the node has not mined', async () => {
    const { addUnconfirmedTokenTransfer, getSpendableTokenBalance } = await loadComposable();
    addUnconfirmedTokenTransfer(send(5, '10'));
    addUnconfirmedTokenTransfer(send(6, '0.123456789012345678'));

    expect((await getSpendableTokenBalance(TOKEN, OWNER, NODE_URL)).toFixed())
      .toBe('39.876543210987654322');
  });

  it('leaves out a send the node no longer has', async () => {
    const { addUnconfirmedTokenTransfer, getSpendableTokenBalance } = await loadComposable();
    addUnconfirmedTokenTransfer(send(5, '10'));
    // E.g. dropped from the mempool, so the next send gets its nonce
    node.pendingCount = 5;

    expect((await getSpendableTokenBalance(TOKEN, OWNER, NODE_URL)).toFixed()).toBe('50');
    // A node that still has it counts it again
    node.pendingCount = 6;
    expect((await getSpendableTokenBalance(TOKEN, OWNER, NODE_URL)).toFixed()).toBe('40');
  });

  it('replaces a dropped send with the next one, which takes its nonce', async () => {
    const { addUnconfirmedTokenTransfer, getSpendableTokenBalance } = await loadComposable();
    addUnconfirmedTokenTransfer(send(5, '10'));
    addUnconfirmedTokenTransfer(send(5, '1', { from: OTHER }));
    // The node dropped the first one
    addUnconfirmedTokenTransfer(send(5, '20'));
    node.pendingCount = 6;

    expect((await getSpendableTokenBalance(TOKEN, OWNER, NODE_URL)).toFixed()).toBe('30');
    // Another account's send with that nonce stays
    expect((await getSpendableTokenBalance(TOKEN, OTHER, NODE_URL)).toFixed()).toBe('49');
  });

  it('replaces a dropped send with the next one of another token', async () => {
    const { addUnconfirmedTokenTransfer, getSpendableTokenBalance } = await loadComposable();
    addUnconfirmedTokenTransfer(send(5, '10', { contractId: OTHER }));
    addUnconfirmedTokenTransfer(send(5, '20'));
    node.pendingCount = 6;

    expect((await getSpendableTokenBalance(OTHER, OWNER, NODE_URL)).toFixed()).toBe('50');
  });

  it('stops leaving a send out once its nonce is mined', async () => {
    const { addUnconfirmedTokenTransfer, getSpendableTokenBalance } = await loadComposable();
    addUnconfirmedTokenTransfer(send(5, '10'));
    node.minedCount = 6;
    node.balance = '40';

    expect((await getSpendableTokenBalance(TOKEN, OWNER, NODE_URL)).toFixed()).toBe('40');
    // A node behind the last one doesn't bring the mined send back
    node.minedCount = 5;
    expect((await getSpendableTokenBalance(TOKEN, OWNER, NODE_URL)).toFixed()).toBe('40');
  });

  it('reads the balance and the mined sends at one block', async () => {
    const { addUnconfirmedTokenTransfer, getSpendableTokenBalance } = await loadComposable();
    addUnconfirmedTokenTransfer(send(5, '10'));
    // A new block mines the send right after the node's first answer
    node.afterAnswer = () => {
      node.pastBlocks[String(node.blockNumber)] = { balance: '50', minedCount: 5 };
      node.blockNumber += 1n;
      node.balance = '40';
      node.minedCount = 6;
    };

    expect((await getSpendableTokenBalance(TOKEN, OWNER, NODE_URL)).toFixed()).toBe('40');
  });

  it('keeps sends of other tokens, accounts and chains out', async () => {
    const { addUnconfirmedTokenTransfer, getSpendableTokenBalance } = await loadComposable();
    addUnconfirmedTokenTransfer(send(5, '1'));
    addUnconfirmedTokenTransfer(send(6, '10', { contractId: OTHER }));
    addUnconfirmedTokenTransfer(send(2, '10', { from: OTHER }));
    addUnconfirmedTokenTransfer(send(5, '10', { nodeUrl: 'https://other-node.example' }));

    expect((await getSpendableTokenBalance(TOKEN, OWNER, NODE_URL)).toFixed()).toBe('49');
    // The owner's mined count doesn't clear the other account's unmined send
    node.minedCount = 2;
    expect((await getSpendableTokenBalance(TOKEN, OTHER, NODE_URL)).toFixed()).toBe('40');
  });

  it('matches addresses in any letter case', async () => {
    const { addUnconfirmedTokenTransfer, getSpendableTokenBalance } = await loadComposable();
    addUnconfirmedTokenTransfer(send(5, '10', { from: OWNER.toLowerCase() }));

    expect((await getSpendableTokenBalance(TOKEN.toLowerCase(), OWNER, NODE_URL)).toFixed())
      .toBe('40');
  });

  it('does not go below zero', async () => {
    const { addUnconfirmedTokenTransfer, getSpendableTokenBalance } = await loadComposable();
    addUnconfirmedTokenTransfer(send(5, '60'));

    expect((await getSpendableTokenBalance(TOKEN, OWNER, NODE_URL)).toFixed()).toBe('0');
  });
});
