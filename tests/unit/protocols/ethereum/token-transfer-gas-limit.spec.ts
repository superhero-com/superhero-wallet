/**
 * [BLACK-BOX] `getTokenTransferGasLimit` - the fee the send form displays and validates
 * against, so it must match the broadcasting adapter on decimals scaling and headroom.
 * `getTokenBalance` - the node's token balance that Max on the send form fills.
 */
const RECIPIENT = '0x0000000000000000000000000000000000000002';
const TOKEN_CONTRACT = '0x0000000000000000000000000000000000000003';
const FROM_ACCOUNT = '0x0000000000000000000000000000000000000001';
const NODE_URL = 'http://localhost:8545';

const contractMockState = {
  decimals: 18n,
  /** Of the account, in the token's base units on the node */
  balance: BigInt(0),
  /** The balance at the blocks before the latest one */
  pastBalances: {} as Record<string, bigint>,
  estimateGas: 65000,
  transferCalls: [] as Array<{ recipient: string; amount: any }>,
  /** The node of each `decimals()` call */
  decimalsRequests: [] as Array<string | undefined>,
  failDecimalsOnce: false,
  /** The next `decimals()` call never answers */
  hangDecimalsOnce: false,
};

async function loadHelper() {
  vi.resetModules();

  // The helper imports the DEFAULT export (`import Contract from 'web3-eth-contract'`),
  // so that is what has to be replaced - mocking the named export leaves the real
  // contract in place and the estimate hits the network.
  vi.doMock('web3-eth-contract', async (importOriginal) => ({
    ...await importOriginal<typeof import('web3-eth-contract')>(),
    // vitest constructs this directly (`new Contract(...)`), which throws on an arrow fn.
    // eslint-disable-next-line prefer-arrow-callback
    default: vi.fn().mockImplementation(function ContractMock(abi: unknown, address: string) {
      let provider: string | undefined;
      return {
        setProvider: (url: string) => { provider = url; },
        methods: {
          decimals: () => ({
            call: () => {
              contractMockState.decimalsRequests.push(provider);
              if (contractMockState.hangDecimalsOnce) {
                contractMockState.hangDecimalsOnce = false;
                return new Promise(() => {});
              }
              if (contractMockState.failDecimalsOnce) {
                contractMockState.failDecimalsOnce = false;
                return Promise.reject(new Error('Node unavailable'));
              }
              return Promise.resolve(contractMockState.decimals);
            },
          }),
          // Nothing for another account, token or node
          balanceOf: (owner: string) => ({
            call: (tx?: unknown, block?: bigint) => Promise.resolve(
              [owner, address, provider].join() === [FROM_ACCOUNT, TOKEN_CONTRACT, NODE_URL].join()
                ? contractMockState.pastBalances[String(block)] ?? contractMockState.balance
                : 0n,
            ),
          }),
          transfer: (recipient: string, amount: any) => {
            contractMockState.transferCalls.push({ recipient, amount });
            return { estimateGas: () => Promise.resolve(contractMockState.estimateGas) };
          },
        },
      };
    }),
  }));

  const BigNumber = (await import('bignumber.js')).default;
  const { getTokenBalance, getTokenTransferGasLimit } = await import('@/protocols/ethereum/helpers');
  return { getTokenBalance, getTokenTransferGasLimit, BigNumber };
}

let getTokenBalance: any;
let getTokenTransferGasLimit: any;
let BigNumber: any;

// Fresh, as the module keeps the decimals it read
beforeEach(async () => {
  const loaded = await loadHelper();
  getTokenBalance = loaded.getTokenBalance;
  getTokenTransferGasLimit = loaded.getTokenTransferGasLimit;
  BigNumber = loaded.BigNumber;
});

beforeEach(() => {
  contractMockState.decimals = 18n;
  contractMockState.balance = BigInt(0);
  contractMockState.pastBalances = {};
  contractMockState.estimateGas = 65000;
  contractMockState.transferCalls.length = 0;
  contractMockState.decimalsRequests.length = 0;
  contractMockState.failDecimalsOnce = false;
  contractMockState.hangDecimalsOnce = false;
});

const estimate = (amount: string) => getTokenTransferGasLimit(
  TOKEN_CONTRACT,
  RECIPIENT,
  FROM_ACCOUNT,
  new BigNumber(amount),
  NODE_URL,
);

const lastTransferAmount = () => BigInt(
  contractMockState.transferCalls.at(-1)!.amount as string,
);

describe('getTokenTransferGasLimit', () => {
  it('scales the estimated amount by a 6-decimal token\'s own decimals', async () => {
    contractMockState.decimals = 6n;

    await estimate('1');

    expect(lastTransferAmount()).toBe(BigInt(1000000));
  });

  it('scales the estimated amount by an 18-decimal token\'s decimals', async () => {
    contractMockState.decimals = 18n;

    await estimate('1');

    expect(lastTransferAmount()).toBe(BigInt('1000000000000000000'));
  });

  it('adds the same 15% headroom as the adapter, then rounds up to the next thousand', async () => {
    // 65000 -> 74750 -> 75000.
    contractMockState.estimateGas = 65000;

    expect(await estimate('1')).toBe(75000);
  });

  it('estimates with the decimals the balance read', async () => {
    contractMockState.decimals = 6n;

    await getTokenBalance(TOKEN_CONTRACT, FROM_ACCOUNT, NODE_URL);
    await estimate('1');

    expect(lastTransferAmount()).toBe(BigInt(1000000));
    expect(contractMockState.decimalsRequests).toHaveLength(1);
  });
});

describe('getTokenBalance', () => {
  it('reads the account\'s balance of the token on the node in its own decimals', async () => {
    contractMockState.decimals = 6n;
    contractMockState.balance = BigInt('123456789');

    const balance = await getTokenBalance(TOKEN_CONTRACT, FROM_ACCOUNT, NODE_URL);

    expect(balance.toFixed()).toBe('123.456789');
  });

  it('reads the balance at the given block', async () => {
    contractMockState.decimals = 6n;
    contractMockState.balance = BigInt('1000000');
    contractMockState.pastBalances['100'] = BigInt('2000000');

    const balance = await getTokenBalance(TOKEN_CONTRACT, FROM_ACCOUNT, NODE_URL, 100n);

    expect(balance.toFixed()).toBe('2');
  });

  it('asks a node for the decimals of a token once', async () => {
    await getTokenBalance(TOKEN_CONTRACT, FROM_ACCOUNT, NODE_URL);
    await getTokenBalance(TOKEN_CONTRACT, FROM_ACCOUNT, NODE_URL);

    expect(contractMockState.decimalsRequests).toEqual([NODE_URL]);
  });

  it('asks each node for the decimals of a token', async () => {
    // A deployer's first contract has the same address on every chain
    const otherNodeUrl = 'http://other-node.example';

    await getTokenBalance(TOKEN_CONTRACT, FROM_ACCOUNT, NODE_URL);
    await getTokenBalance(TOKEN_CONTRACT, FROM_ACCOUNT, otherNodeUrl);

    expect(contractMockState.decimalsRequests).toEqual([NODE_URL, otherNodeUrl]);
  });

  it('asks for the decimals again when the node failed to answer', async () => {
    contractMockState.failDecimalsOnce = true;

    await expect(getTokenBalance(TOKEN_CONTRACT, FROM_ACCOUNT, NODE_URL)).rejects.toThrow('Node unavailable');
    await getTokenBalance(TOKEN_CONTRACT, FROM_ACCOUNT, NODE_URL);

    expect(contractMockState.decimalsRequests).toEqual([NODE_URL, NODE_URL]);
  });

  it('asks for the decimals again while an earlier request has no answer', async () => {
    contractMockState.hangDecimalsOnce = true;
    contractMockState.balance = BigInt('2000000000000000000');
    getTokenBalance(TOKEN_CONTRACT, FROM_ACCOUNT, NODE_URL);

    const balance = await getTokenBalance(TOKEN_CONTRACT, FROM_ACCOUNT, NODE_URL);

    expect(balance.toFixed()).toBe('2');
    expect(contractMockState.decimalsRequests).toEqual([NODE_URL, NODE_URL]);
  });
});
