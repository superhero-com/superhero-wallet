import type { IEvmCall } from '@/types';
import { addWraps, readSimulatedLogs, simulateEvmCall } from '@/protocols/evm/libs/simulateEvmCall';
import { PERMIT2_ADDRESS } from '@/protocols/evm/helpers/decodeEvmCallIntent';
import { PROTOCOLS } from '@/constants';
import {
  batchData,
  log,
  SELECTORS,
  TOPICS,
  word,
  words,
} from '../../../helpers/evmAbi';

// Checksummed, as the handler hands it over, while nodes write logs in lower case
const USER = '0xABCdeFaBCdeFaBcdEFAbcDeFabCdEFABCDef0001';
const OTHER = '0x2222222222222222222222222222222222222222';
const ROUTER = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD';
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const BAYC = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
const COIN = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
/** Reth's, e.g. Sepolia's default node */
const RETH_COIN = '0xfffffffffffffffffffffffffffffffffffffffe';

const ZERO = `0x${'0'.repeat(40)}`;
const ONE_ETH = 10n ** 18n;

/** A word as a topic or an `eth_call` answer */
const hexWord = (value: bigint | string) => `0x${word(value)}`;
const transfer = (asset: string, from: string, to: string, amount: bigint) => log(
  asset,
  [TOPICS.transfer, hexWord(from), hexWord(to)],
  words(amount),
);
const deposit = (asset: string, dst: string, wad: bigint) => log(
  asset,
  [TOPICS.deposit, hexWord(dst)],
  words(wad),
);
const withdrawal = (asset: string, src: string, wad: bigint) => log(
  asset,
  [TOPICS.withdrawal, hexWord(src)],
  words(wad),
);

describe('readSimulatedLogs', () => {
  it.each([
    ['geth', COIN],
    ['reth', RETH_COIN],
  ])('reads a coin transfer of the user, as `traceTransfers` of %s gives it', (_, coin) => {
    expect(readSimulatedLogs([transfer(coin, USER, OTHER, 10n ** 16n)], USER)).toEqual({
      changes: [{ asset: undefined, tokenId: undefined, amount: (-(10n ** 16n)).toString() }],
      wraps: [],
      approvals: [],
      spentApprovals: [],
      hasUnreadEvents: false,
    });
  });

  it('reads a log in upper-case hex too', () => {
    const { address, topics, data } = transfer(USDC, OTHER, USER, 5n);
    const upper = (hex: string) => `0x${hex.slice(2).toUpperCase()}`;

    expect(readSimulatedLogs([{
      address: upper(address), topics: topics.map(upper), data: upper(data),
    }], USER).changes).toEqual([{ asset: USDC, tokenId: undefined, amount: '5' }]);
  });

  describe('wraps of the coin, which WETH9 tells with Deposit and Withdrawal', () => {
    it('reads a wrap', () => {
      const logs = [transfer(COIN, USER, WETH, ONE_ETH), deposit(WETH, USER, ONE_ETH)];

      expect(readSimulatedLogs(logs, USER)).toMatchObject({
        changes: [{ asset: undefined, amount: (-ONE_ETH).toString() }],
        wraps: [{ asset: WETH, amount: ONE_ETH.toString() }],
      });
    });

    it('reads an unwrap', () => {
      const logs = [transfer(COIN, WETH, USER, ONE_ETH), withdrawal(WETH, USER, ONE_ETH)];

      expect(readSimulatedLogs(logs, USER)).toMatchObject({
        changes: [{ asset: undefined, amount: ONE_ETH.toString() }],
        wraps: [{ asset: WETH, amount: (-ONE_ETH).toString() }],
      });
    });

    it.each([
      // A token staked, which moves no coin
      ['without the coin moving', [transfer(USDC, USER, ROUTER, 5n), deposit(ROUTER, USER, 5n)]],
      ['for another amount of the coin', [transfer(COIN, USER, WETH, 1n), deposit(WETH, USER, 2n)]],
      ['with the coin sent elsewhere', [transfer(COIN, USER, ROUTER, 1n), deposit(WETH, USER, 1n)]],
      ['of someone else', [transfer(COIN, ROUTER, WETH, 1n), deposit(WETH, ROUTER, 1n)]],
      ['with the coin coming from elsewhere', [transfer(COIN, ROUTER, USER, 1n), withdrawal(WETH, USER, 1n)]],
      // WETH10-style, the Transfer is read already
      ['with a mint', [transfer(COIN, USER, WETH, 1n), transfer(WETH, ZERO, USER, 1n), deposit(WETH, USER, 1n)]],
      ['with a burn', [transfer(WETH, USER, ZERO, 1n), transfer(COIN, WETH, USER, 1n), withdrawal(WETH, USER, 1n)]],
    ])('reads no wrap %s', (_, logs) => {
      expect(readSimulatedLogs(logs, USER).wraps).toEqual([]);
    });

    it('pairs each coin move with one event', () => {
      const logs = [
        transfer(COIN, USER, WETH, 1n),
        deposit(WETH, USER, 1n),
        deposit(WETH, USER, 1n),
      ];

      expect(readSimulatedLogs(logs, USER).wraps).toEqual([{ asset: WETH, amount: '1' }]);
    });

    it('nets a wrap with the wrapped coin sent on, as an EIP-7702 account can batch', () => {
      const logs = [
        transfer(COIN, USER, WETH, ONE_ETH),
        deposit(WETH, USER, ONE_ETH),
        transfer(WETH, USER, OTHER, ONE_ETH),
      ];
      const { changes, wraps } = readSimulatedLogs(logs, USER);

      expect(addWraps(changes, wraps))
        .toEqual([{ asset: undefined, tokenId: undefined, amount: (-ONE_ETH).toString() }]);
    });
  });

  it('adds the wraps to the changes of the same token, or as their own', () => {
    expect(addWraps(
      [{ asset: WETH, amount: '-2' }, { asset: BAYC, tokenId: '1', amount: '1' }],
      [{ asset: WETH, amount: '5' }, { asset: BAYC, amount: '1' }],
    )).toEqual([
      { asset: WETH, amount: '3' },
      { asset: BAYC, tokenId: '1', amount: '1' },
      { asset: BAYC, tokenId: undefined, amount: '1' },
    ]);
  });

  it('nets the changes of a swap per asset', () => {
    const logs = [
      transfer(USDC, USER, ROUTER, 600n),
      transfer(USDC, USER, ROUTER, 400n),
      transfer(WETH, ROUTER, USER, 5n),
      transfer(USDC, ROUTER, OTHER, 1000n),
    ];

    expect(readSimulatedLogs(logs, USER).changes).toEqual([
      { asset: USDC, tokenId: undefined, amount: '-1000' },
      { asset: WETH, tokenId: undefined, amount: '5' },
    ]);
  });

  it('takes what the user sends to themselves for no change', () => {
    expect(readSimulatedLogs([transfer(COIN, USER, USER, 1n)], USER).changes).toEqual([]);
  });

  it('reads the coin only from the transfers on Polygon, not its own fee logs', () => {
    const logs = [
      transfer(COIN, USER, OTHER, 1n),
      // LogTransfer and LogFeeTransfer of the POL contract
      log('0x0000000000000000000000000000000000001010', ['0xe6497e3ee548a3372136af2fcb0696db31fc6cf20260707645068bd3fe97f3c4', hexWord('0x1010'), hexWord(USER), hexWord(OTHER)], words(1n, 2n, 3n, 4n, 5n)),
      log('0x0000000000000000000000000000000000001010', ['0x4dfe1bbbcf077ddc3e01291eea2d5c70c2b422b415d95645b9adcfd678cb1d63', hexWord('0x1010'), hexWord(USER), hexWord(OTHER)], words(1n, 2n, 3n, 4n, 5n)),
    ];

    expect(readSimulatedLogs(logs, USER)).toEqual({
      changes: [{ asset: undefined, tokenId: undefined, amount: '-1' }],
      wraps: [],
      approvals: [],
      spentApprovals: [],
      hasUnreadEvents: false,
    });
  });

  it('reads NFTs sent and received', () => {
    const logs = [
      log(BAYC, [TOPICS.transfer, hexWord(USER), hexWord(OTHER), hexWord(42n)]),
      log(BAYC, [TOPICS.transferSingle, ROUTER, OTHER, USER], words(7n, 3n)),
    ];

    expect(readSimulatedLogs(logs, USER).changes).toEqual([
      { asset: BAYC, tokenId: '42', amount: '-1' },
      { asset: BAYC, tokenId: '7', amount: '3' },
    ]);
  });

  it('reads each item of an ERC-1155 batch', () => {
    const logs = [
      log(BAYC, [TOPICS.transferBatch, ROUTER, USER, OTHER], batchData([7n, 8n], [3n, 1n])),
      log(BAYC, [TOPICS.transferBatch, ROUTER, OTHER, USER], batchData([9n], [2n])),
      log(BAYC, [TOPICS.transferBatch, ROUTER, OTHER, ROUTER], batchData([10n], [5n])),
    ];

    expect(readSimulatedLogs(logs, USER)).toMatchObject({
      changes: [
        { asset: BAYC, tokenId: '7', amount: '-3' },
        { asset: BAYC, tokenId: '8', amount: '-1' },
        { asset: BAYC, tokenId: '9', amount: '2' },
      ],
      hasUnreadEvents: false,
    });
  });

  it.each([
    ['as many ids as amounts', batchData([7n, 8n], [3n])],
    ['arrays', '0x00'],
  ])('tells of an ERC-1155 batch of the user without %s', (_, data) => {
    const batch = log(BAYC, [TOPICS.transferBatch, ROUTER, USER, OTHER], data);

    expect(readSimulatedLogs([batch], USER)).toMatchObject({ changes: [], hasUnreadEvents: true });
  });

  it('reads the approvals the user gives', () => {
    const logs = [
      log(USDC, [TOPICS.approval, hexWord(USER), hexWord(ROUTER)], words(2n ** 256n - 1n)),
      log(BAYC, [TOPICS.approvalForAll, hexWord(USER), hexWord(OTHER)], words(1n)),
      log(BAYC, [TOPICS.approval, hexWord(USER), hexWord(OTHER), hexWord(9n)]),
      log(
        PERMIT2_ADDRESS,
        [TOPICS.permit2Approval, hexWord(USER), hexWord(WETH), hexWord(ROUTER)],
        words(5n, 1795000000n),
      ),
    ];

    expect(readSimulatedLogs(logs, USER).approvals).toEqual([
      { asset: USDC, spender: ROUTER, amount: (2n ** 256n - 1n).toString() },
      { asset: BAYC, spender: OTHER, isAll: true },
      { asset: BAYC, spender: OTHER, tokenId: '9' },
      {
        asset: WETH, spender: ROUTER, amount: '5', isPermit2: true,
      },
    ]);
  });

  it('leaves out rights removed and those of others', () => {
    const logs = [
      transfer(USDC, USER, ROUTER, 10n),
      log(WETH, [TOPICS.approval, hexWord(USER), hexWord(ROUTER)], words(0n)),
      log(BAYC, [TOPICS.approvalForAll, hexWord(USER), hexWord(OTHER)], words(0n)),
      // A sent NFT clears its approval
      log(BAYC, [TOPICS.transfer, hexWord(USER), hexWord(OTHER), hexWord(42n)]),
      log(BAYC, [TOPICS.approval, hexWord(USER), hexWord(0n), hexWord(42n)]),
      log(USDC, [TOPICS.approval, hexWord(OTHER), hexWord(ROUTER)], words(1n)),
      // A Permit2 event of another contract
      log(USDC, [TOPICS.permit2Approval, USER, WETH, ROUTER], words(5n, 1n)),
    ];

    expect(readSimulatedLogs(logs, USER)).toMatchObject({ approvals: [], spentApprovals: [] });
  });

  it('sets apart the approvals of a token sent, the last of each spender', () => {
    const logs = [
      log(USDC, [TOPICS.approval, hexWord(USER), hexWord(ROUTER)], words(100n)),
      transfer(USDC, USER, OTHER, 10n),
      // As OpenZeppelin's ERC-20 before 4.5 tells the allowance left after a `transferFrom`
      log(USDC, [TOPICS.approval, hexWord(USER), hexWord(ROUTER)], words(90n)),
    ];

    expect(readSimulatedLogs(logs, USER)).toMatchObject({
      approvals: [],
      spentApprovals: [{ asset: USDC, spender: ROUTER, amount: '90' }],
    });
  });

  it('keeps an allowance of Permit2 for a token sent, as Permit2 tells no spending', () => {
    const logs = [
      log(
        PERMIT2_ADDRESS,
        [TOPICS.permit2Permit, hexWord(USER), hexWord(USDC), hexWord(ROUTER)],
        words(2n ** 160n - 1n, 1795000000n, 0n),
      ),
      transfer(USDC, USER, OTHER, 10n),
    ];

    expect(readSimulatedLogs(logs, USER)).toMatchObject({
      approvals: [{
        asset: USDC, spender: ROUTER, amount: (2n ** 160n - 1n).toString(), isPermit2: true,
      }],
      spentApprovals: [],
    });
  });

  it.each([
    ['no logs', undefined],
    ['a log without topics', [{ address: USDC, data: '0x' }]],
    ['short topics', [{ address: USDC, topics: [TOPICS.transfer, '0x01', hexWord(USER)], data: words(1n) }]],
    ['data that is not a word', [log(USDC, [TOPICS.transfer, hexWord(OTHER), hexWord(USER)], '0x01')]],
  ])('reads nothing from %s', (_, logs) => {
    expect(readSimulatedLogs(logs, USER)).toMatchObject({ changes: [], approvals: [] });
  });

  it('tells of a transfer of the user it can not read', () => {
    const odd = log(USDC, [TOPICS.transfer, hexWord(USER), hexWord(OTHER)], words(1n, 2n));

    expect(readSimulatedLogs([odd], USER)).toMatchObject({ changes: [], hasUnreadEvents: true });
  });

  it.each([
    // CryptoKitties: Transfer(address from, address to, uint256 tokenId), none indexed
    ['none indexed', log(BAYC, [TOPICS.transfer], words(USER, OTHER, 42n))],
    ['only the sender indexed', log(USDC, [TOPICS.transfer, hexWord(OTHER)], words(USER, 5n))],
  ])('tells of a transfer with the user in its data, %s', (_, oldStyle) => {
    expect(readSimulatedLogs([oldStyle], USER))
      .toMatchObject({ changes: [], hasUnreadEvents: true });
  });

  it('tells nothing of an old-style transfer of others', () => {
    const oldStyle = log(BAYC, [TOPICS.transfer], words(OTHER, ROUTER, 42n));
    const withoutData = log(BAYC, [TOPICS.transfer, hexWord(OTHER)]);

    expect(readSimulatedLogs([oldStyle, withoutData], USER).hasUnreadEvents).toBe(false);
  });
});

describe('simulateEvmCall', () => {
  const NODE = 'https://node.test';
  const CALL: IEvmCall = {
    from: USER, to: USDC, value: '0x0', data: '0xa9059cbb', gas: '0x186a0', chainId: '1',
  };
  let requests: any[];

  /** On Avalanche, which gets no overrides */
  const simulate = (call: IEvmCall) => simulateEvmCall(NODE, call, PROTOCOLS.avalanche);

  function answer(body: object | (() => never), status = 200) {
    requests = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      requests.push({ url, ...JSON.parse(init.body as string) });
      if (typeof body === 'function') body();
      return { status, json: async () => ({ jsonrpc: '2.0', id: 1, ...body }) };
    }));
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it.each([
    ['Ethereum', PROTOCOLS.ethereum],
    ['BNB Smart Chain', PROTOCOLS.bnb],
  ])('runs a call without fees unvalidated, on the block as the node of %s makes it', async (_, protocol) => {
    answer({ result: [{ calls: [{ status: '0x1', logs: [transfer(USDC, USER, OTHER, 5n)] }] }] });

    // Without the fees its base fee is 0 anyway
    expect(await simulateEvmCall(NODE, CALL, protocol)).toEqual({
      status: 'ok',
      changes: [{ asset: USDC, tokenId: undefined, amount: '-5' }],
      wraps: [],
      approvals: [],
      hasUnreadEvents: false,
    });
    expect(requests).toEqual([expect.objectContaining({
      url: NODE,
      method: 'eth_simulateV1',
      params: [{
        blockStateCalls: [{
          calls: [{
            from: USER, to: USDC, value: '0x0', data: '0xa9059cbb', gas: '0x186a0',
          }],
        }],
        traceTransfers: true,
        validation: false,
      }, 'latest'],
    })]);
  });

  describe('a call with the fees it is signed with', () => {
    const FEES = { maxFeePerGas: '0x5d21dba00', maxPriorityFeePerGas: '0x3b9aca00' };
    const SIGNED_CALL = { ...CALL, ...FEES };
    const OK = { result: [{ calls: [{ status: '0x1', logs: [transfer(USDC, USER, OTHER, 5n)] }] }] };

    /** Of the node's latest block, and the time a second after it */
    const LATEST = { number: '0x10', timestamp: '0x65553f00' };
    const NEXT_SECOND = '0x65553f01';

    /** Answers the latest block with `latest`, and the simulations in turn with `bodies` */
    function answerWithLatest(latest: object | (() => never), ...bodies: object[]) {
      requests = [];
      let simulationCount = 0;
      vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
        const request = JSON.parse(init.body as string);
        requests.push(request);
        let body: object;
        if (request.method === 'eth_getBlockByNumber') {
          if (typeof latest === 'function') latest();
          body = latest;
        } else {
          body = bodies[simulationCount];
          simulationCount += 1;
        }
        return { status: 200, json: async () => ({ jsonrpc: '2.0', id: 1, ...body }) };
      }));
    }

    /** Answers the simulations in turn with `bodies` */
    const answerInTurn = (...bodies: object[]) => answerWithLatest({ result: LATEST }, ...bodies);

    const simulations = () => requests.filter(({ method }) => method === 'eth_simulateV1');
    const blockReads = () => requests.filter(({ method }) => method === 'eth_getBlockByNumber');
    const sentFees = () => simulations().map(({ params: [{ blockStateCalls, validation }] }) => {
      const [{ calls: [{ gasPrice, maxFeePerGas, maxPriorityFeePerGas }] }] = blockStateCalls;
      return {
        gasPrice, maxFeePerGas, maxPriorityFeePerGas, validation,
      };
    });

    it.each([
      ['EIP-1559 fees', FEES],
      ['a gas price', { gasPrice: '0x6fc23ac00' }],
    ])('runs it validated with %s, so it sees the real gas price and base fee', async (_, fees) => {
      answerInTurn(OK);

      expect(await simulate({ ...CALL, ...fees }))
        .toMatchObject({ status: 'ok', changes: [{ asset: USDC, amount: '-5' }] });
      expect(sentFees()).toEqual([{
        gasPrice: undefined,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        ...fees,
        validation: true,
      }]);
    });

    it.each([
      ['Ethereum', { code: -38012, message: 'err: max fee per gas less than block base fee' }],
      ['Polygon', { code: -32602, message: 'err: max fee per gas less than block base fee' }],
    ])('runs it as before where the node of %s refuses its fee', async (_, error) => {
      answerInTurn({ error }, OK);

      expect(await simulate(SIGNED_CALL))
        .toMatchObject({ status: 'ok', changes: [{ asset: USDC, amount: '-5' }] });
      expect(sentFees()).toEqual([
        { ...FEES, gasPrice: undefined, validation: true },
        {
          gasPrice: undefined,
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined,
          validation: false,
        },
      ]);
    });

    it('maps the error of the run without fees too', async () => {
      answerInTurn(
        { error: { code: -38012, message: 'err: max fee per gas less than block base fee' } },
        { error: { code: -38014, message: 'err: insufficient funds for gas * price + value' } },
      );

      expect(await simulate(SIGNED_CALL)).toEqual({ status: 'insufficientFunds' });
      expect(requests).toHaveLength(2);
    });

    describe('the block it runs on', () => {
      const sentOverrides = () => simulations()
        .map(({ params: [{ blockStateCalls: [{ blockOverrides }] }] }) => blockOverrides);
      const sentBlocks = () => simulations().map(({ params: [, block] }) => block);
      const ETHEREUM_OVERRIDES = { prevRandao: expect.any(String), beaconRoot: expect.any(String) };

      it('has a random beacon and beacon root on Ethereum, where a drainer could tell 0', async () => {
        answerInTurn(OK, OK);
        await simulateEvmCall(NODE, SIGNED_CALL, PROTOCOLS.ethereum);
        await simulateEvmCall(NODE, SIGNED_CALL, PROTOCOLS.ethereum);

        const [first, second] = sentOverrides();
        const randomWord = expect.stringMatching(/^0x[\da-f]{64}$/);
        expect(first).toEqual({ prevRandao: randomWord, beaconRoot: randomWord });
        expect(first.beaconRoot).not.toBe(first.prevRandao);
        expect(second.prevRandao).not.toBe(first.prevRandao);
        expect(second.beaconRoot).not.toBe(first.beaconRoot);
        // A block every 12 s, as the node makes it
        expect(blockReads()).toEqual([]);
        expect(sentBlocks()).toEqual(['latest', 'latest']);
      });

      it.each([
        ['Polygon', PROTOCOLS.polygonPos, { difficulty: '0x1', time: NEXT_SECOND }],
        // Its node keeps the real difficulty, and refuses a beacon
        ['BNB Smart Chain', PROTOCOLS.bnb, { time: NEXT_SECOND }],
      ])('has the values of a real block of %s, a second after the latest', async (_, protocol, overrides) => {
        answerInTurn(OK);
        await simulateEvmCall(NODE, SIGNED_CALL, protocol);

        expect(blockReads()).toEqual([expect.objectContaining({ params: ['latest', false] })]);
        expect(sentOverrides()).toEqual([overrides]);
        // The time is of that block, which the node's latest may be no more
        expect(sentBlocks()).toEqual([LATEST.number]);
      });

      it('is the node\'s own on Avalanche', async () => {
        answerInTurn(OK);
        await simulateEvmCall(NODE, SIGNED_CALL, PROTOCOLS.avalanche);

        expect(blockReads()).toEqual([]);
        expect(sentOverrides()).toEqual([undefined]);
        expect(sentBlocks()).toEqual(['latest']);
      });

      it.each([
        ['an error', { error: { code: -32000, message: 'header not found' } }],
        ['no block', { result: null }],
        ['a block without a time', { result: { number: '0x10' } }],
        ['nothing', () => { throw new TypeError('Failed to fetch'); }],
      ])('runs on the latest block where the node answers %s for it', async (_, latest) => {
        answerWithLatest(latest, OK, OK);
        await simulateEvmCall(NODE, SIGNED_CALL, PROTOCOLS.bnb);
        await simulateEvmCall(NODE, SIGNED_CALL, PROTOCOLS.polygonPos);

        expect(sentOverrides()).toEqual([undefined, { difficulty: '0x1' }]);
        expect(sentBlocks()).toEqual(['latest', 'latest']);
      });

      it.each([
        [
          'Ethereum, where it refuses the overrides',
          PROTOCOLS.ethereum,
          { code: -32000, message: 'block override "prevRandao" must be less than 1000' },
          ETHEREUM_OVERRIDES,
          'latest',
        ],
        [
          'BNB Smart Chain, where it doesn\'t know the block just read',
          PROTOCOLS.bnb,
          { code: -32000, message: 'header not found' },
          { time: NEXT_SECOND },
          LATEST.number,
        ],
      ])('is the node\'s own on %s', async (_, protocol, error, overrides, block) => {
        answerInTurn({ error }, OK);

        expect(await simulateEvmCall(NODE, SIGNED_CALL, protocol))
          .toMatchObject({ status: 'ok', changes: [{ asset: USDC, amount: '-5' }] });
        expect(sentOverrides()).toEqual([overrides, undefined]);
        expect(sentBlocks()).toEqual([block, 'latest']);
        expect(sentFees()).toEqual([
          { ...FEES, gasPrice: undefined, validation: true },
          { ...FEES, gasPrice: undefined, validation: true },
        ]);
      });

      it('is the node\'s own in the run without fees', async () => {
        const feeError = { code: -38012, message: 'err: max fee per gas less than block base fee' };
        answerInTurn({ error: feeError }, { error: feeError }, OK);

        expect(await simulateEvmCall(NODE, SIGNED_CALL, PROTOCOLS.ethereum))
          .toMatchObject({ status: 'ok' });
        expect(sentOverrides()).toEqual([ETHEREUM_OVERRIDES, undefined, undefined]);
        expect(sentFees().map(({ validation }) => validation)).toEqual([true, true, false]);
      });
    });

    it.each([
      ['Avalanche', PROTOCOLS.avalanche],
      // Not again without the overrides either
      ['Ethereum', PROTOCOLS.ethereum],
      ['BNB Smart Chain', PROTOCOLS.bnb],
    ])('tells that the account can not pay the fee on %s, without running it again', async (_, protocol) => {
      answerInTurn({ error: { code: -38014, message: 'err: insufficient funds for gas * price + value' } });

      expect(await simulateEvmCall(NODE, SIGNED_CALL, protocol))
        .toEqual({ status: 'insufficientFunds' });
      expect(simulations()).toHaveLength(1);
    });

    it.each([
      ['Avalanche', PROTOCOLS.avalanche, 0],
      ['Ethereum', PROTOCOLS.ethereum, 0],
      ['BNB Smart Chain', PROTOCOLS.bnb, 1],
    ])('runs it once on a node of %s that can not simulate', async (_, protocol, reads) => {
      answerInTurn({ error: { code: -32601, message: 'the method eth_simulateV1 does not exist' } });

      expect(await simulateEvmCall(NODE, SIGNED_CALL, protocol)).toEqual({ status: 'unsupported' });
      expect(simulations()).toHaveLength(1);
      expect(blockReads()).toHaveLength(reads);
    });
  });

  it('tells a call that would revert, with the reason', async () => {
    answer({
      result: [{
        calls: [{
          status: '0x0',
          logs: [],
          error: { code: 3, message: 'execution reverted: ERC20: transfer amount exceeds balance', data: '0x08c379a0' },
        }],
      }],
    });

    expect(await simulate(CALL)).toEqual({
      status: 'reverted', reason: 'execution reverted: ERC20: transfer amount exceeds balance',
    });
  });

  it.each([
    ['a newline and right-to-left marks', 'execution reverted: \u202eEXPIRED\nnow\u200b', 'execution reverted: EXPIRED now'],
    ['a long text', `execution reverted: ${'a'.repeat(1000)}`, `execution reverted: ${'a'.repeat(180)}…`],
    ['no text', { text: 'reverted' }, undefined],
    ['only invisible characters', '\u202e\u0000', undefined],
    // Stacked marks draw over the lines around
    ['a stack of combining marks', `execution reverted: a${'\u0301'.repeat(50)}`, 'execution reverted: a\u0301\u0301'],
  ])('cleans a revert reason with %s', async (_, message, reason) => {
    answer({ result: [{ calls: [{ status: '0x0', logs: [], error: { code: 3, message } }] }] });

    expect(await simulate(CALL)).toEqual({ status: 'reverted', reason });
  });

  describe('an approval of a token the call sends', () => {
    const SPEND_LOGS = [
      transfer(USDC, USER, OTHER, 10n),
      log(USDC, [TOPICS.approval, hexWord(USER), hexWord(ROUTER)], words(2n ** 256n - 11n)),
    ];

    /** Answers the simulation with `logs`, and `allowance` with `before`, or with one by spender */
    function stubNode(logs: object[], before: object | ((spenderWord: string) => object)) {
      requests = [];
      vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string);
        requests.push(body);
        if (body.method === 'eth_simulateV1') {
          return { status: 200, json: async () => ({ result: [{ calls: [{ status: '0x1', logs }] }] }) };
        }
        const allowance = (typeof before === 'function')
          ? before(body.params[0].data.slice(-64))
          : before;
        return { status: 200, json: async () => allowance };
      }));
    }

    it('is left out where it lowers the allowance, as spending it does', async () => {
      stubNode(SPEND_LOGS, { result: hexWord(2n ** 256n - 1n) });

      expect(await simulate(CALL)).toMatchObject({ status: 'ok', approvals: [] });
      expect(requests[1]).toMatchObject({
        method: 'eth_call',
        params: [{ to: USDC, data: `${SELECTORS.allowance}${word(USER)}${word(ROUTER)}` }, 'latest'],
      });
    });

    it('is told where it raises the allowance, as a permit in the call does', async () => {
      stubNode(SPEND_LOGS, { result: hexWord(0n) });

      expect(await simulate(CALL)).toMatchObject({
        status: 'ok',
        approvals: [{ asset: USDC, spender: ROUTER, amount: (2n ** 256n - 11n).toString() }],
      });
    });

    it('is left out where it leaves the allowance as it was', async () => {
      stubNode(SPEND_LOGS, { result: hexWord(2n ** 256n - 11n) });

      expect(await simulate(CALL)).toMatchObject({ status: 'ok', approvals: [] });
    });

    it('tells each spender for itself, after the approvals of other tokens', async () => {
      const DRAINER = '0x9999999999999999999999999999999999999999';
      const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
      const before: Record<string, bigint> = {
        [word(ROUTER)]: 2n ** 256n - 1n,
        [word(DRAINER)]: 0n,
      };
      stubNode([
        log(DAI, [TOPICS.approval, hexWord(USER), hexWord(OTHER)], words(7n)),
        ...SPEND_LOGS,
        log(USDC, [TOPICS.approval, hexWord(USER), hexWord(DRAINER)], words(2n ** 256n - 1n)),
      ], (spenderWord) => ({ result: hexWord(before[spenderWord]) }));

      expect(await simulate(CALL)).toMatchObject({
        status: 'ok',
        approvals: [
          { asset: DAI, spender: OTHER, amount: '7' },
          { asset: USDC, spender: DRAINER, amount: (2n ** 256n - 1n).toString() },
        ],
      });
    });

    it.each([
      ['fails', () => { throw new TypeError('Failed to fetch'); }],
      ['answers an error', { error: { code: -32005, message: 'rate limit exceeded' } }],
      ['answers no word', { result: '0x' }],
    ])('is told where the node %s, as the right may be new', async (_, before) => {
      stubNode(SPEND_LOGS, before);

      expect(await simulate(CALL)).toMatchObject({
        status: 'ok',
        approvals: [{ asset: USDC, spender: ROUTER, amount: (2n ** 256n - 11n).toString() }],
      });
    });
  });

  it.each([
    ['Avalanche', { code: -32601, message: 'the method eth_simulateV1 does not exist' }, 200],
    ['a node without the method', { code: -32601, message: 'Method not found' }, 200],
    ['a node that refuses it', { code: -32600, message: 'Method eth_simulateV1 not allowed' }, 200],
    ['a provider without it', { code: -32000, message: 'eth_simulateV1 is not supported' }, 200],
    ['a node that answers with an HTTP error', { code: -32601, message: 'Method not found' }, 400],
  ])('tells that %s can not simulate', async (_, error, status) => {
    answer({ error }, status);

    expect(await simulate(CALL)).toEqual({ status: 'unsupported' });
  });

  it('tells a value the account does not have', async () => {
    answer({ error: { code: -38014, message: 'err: insufficient funds for gas * price + value' } });

    expect(await simulate(CALL)).toEqual({ status: 'insufficientFunds' });
  });

  it.each([
    ['another error', { error: { code: -32000, message: 'header not found' } }],
    ['an empty result', { result: [] }],
    ['a result without a status', { result: [{ calls: [{ logs: [] }] }] }],
  ])('fails on %s', async (_, body) => {
    answer(body);

    expect(await simulate(CALL)).toEqual({ status: 'failed' });
    // Without fees there is nothing to run otherwise
    expect(requests).toHaveLength(1);
  });

  it('fails when the node does not answer', async () => {
    answer(() => { throw new TypeError('Failed to fetch'); });

    expect(await simulate(CALL)).toEqual({ status: 'failed' });
  });

  it('gives up on a node that takes too long', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_, reject) => {
      init.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    })));
    const simulation = simulate(CALL);
    let isSettled = false;
    simulation.then(() => { isSettled = true; });
    await vi.advanceTimersByTimeAsync(7999);
    expect(isSettled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    expect(await simulation).toEqual({ status: 'failed' });
  });
});
