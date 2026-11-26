import { getEvmTokenMeta, fetchIsEvmContract } from '@/protocols/evm/helpers/evmAddressInfo';
import { abiString, SELECTORS, word } from '../../../helpers/evmAbi';

const NODE = 'https://node.test';
const TOKEN = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

type Answer = { result?: string; error?: { code: number; message: string } };

/** Answers `eth_call` by its selector and `eth_getCode` by the address */
function stubNode(answers: Record<string, Answer | (() => never)>) {
  const requests: any[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    const body = JSON.parse(init.body as string);
    requests.push({ url, ...body });
    const key = body.method === 'eth_call' ? body.params[0].data.slice(0, 10) : body.params[0];
    const answer = answers[key];
    if (typeof answer === 'function') answer();
    return { status: 200, json: async () => ({ jsonrpc: '2.0', id: 1, ...answer }) };
  }));
  return requests;
}

const REVERT = { error: { code: 3, message: 'execution reverted' } };

describe('getEvmTokenMeta', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads the decimals and symbol of an ERC-20 token', async () => {
    const requests = stubNode({
      [SELECTORS.decimals]: { result: `0x${word(6n)}` },
      [SELECTORS.symbol]: { result: abiString('USDC') },
    });

    expect(await getEvmTokenMeta(NODE, TOKEN)).toEqual({ symbol: 'USDC', decimals: 6 });
    expect(requests.map(({ url, params }) => [url, params[0].to, params[1]]))
      .toEqual([[NODE, TOKEN, 'latest'], [NODE, TOKEN, 'latest']]);
  });

  it('reads a bytes32 symbol', async () => {
    stubNode({
      [SELECTORS.decimals]: { result: `0x${word(18n)}` },
      [SELECTORS.symbol]: { result: `0x${Buffer.from('MKR').toString('hex').padEnd(64, '0')}` },
    });

    expect(await getEvmTokenMeta(NODE, TOKEN)).toEqual({ symbol: 'MKR', decimals: 18 });
  });

  it('drops control characters a token puts in its symbol', async () => {
    stubNode({
      [SELECTORS.decimals]: { result: `0x${word(18n)}` },
      [SELECTORS.symbol]: { result: abiString('US‮DC\n') },
    });

    expect(await getEvmTokenMeta(NODE, TOKEN)).toEqual({ symbol: 'USDC', decimals: 18 });
  });

  it('tells an ERC-721 collection, which has no decimals', async () => {
    stubNode({
      [SELECTORS.decimals]: REVERT,
      [SELECTORS.symbol]: { result: abiString('BAYC') },
      [SELECTORS.supportsInterface]: { result: `0x${word(1n)}` },
    });

    expect(await getEvmTokenMeta(NODE, TOKEN)).toEqual({ symbol: 'BAYC', isNft: true });
  });

  it('knows nothing of an account, or a node that is down', async () => {
    stubNode({
      [SELECTORS.decimals]: { result: '0x' },
      [SELECTORS.symbol]: () => { throw new TypeError('Failed to fetch'); },
      [SELECTORS.supportsInterface]: { result: '0x' },
    });

    expect(await getEvmTokenMeta(NODE, TOKEN)).toEqual({ symbol: undefined, isNft: false });
  });

  it('takes decimals out of range for no token', async () => {
    stubNode({
      [SELECTORS.decimals]: { result: `0x${word(256n)}` },
      [SELECTORS.symbol]: REVERT,
      [SELECTORS.supportsInterface]: REVERT,
    });

    expect(await getEvmTokenMeta(NODE, TOKEN)).toEqual({ symbol: undefined, isNft: false });
  });

  it('takes a symbol with a broken offset for none', async () => {
    stubNode({
      [SELECTORS.decimals]: { result: `0x${word(6n)}` },
      [SELECTORS.symbol]: { result: `0x${word(4096n)}${word(4n)}` },
    });

    expect(await getEvmTokenMeta(NODE, TOKEN)).toEqual({ symbol: undefined, decimals: 6 });
  });
});

describe('fetchIsEvmContract', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ['an account', '0x', false],
    ['a contract', '0x6080604052', true],
    ['an account with EIP-7702 code', `0xef0100${'ab'.repeat(20)}`, false],
  ])('tells %s', async (_, code, isContract) => {
    stubNode({ [TOKEN]: { result: code } });

    expect(await fetchIsEvmContract(NODE, TOKEN)).toBe(isContract);
  });

  it('knows nothing when the node does not answer', async () => {
    stubNode({ [TOKEN]: () => { throw new TypeError('Failed to fetch'); } });

    expect(await fetchIsEvmContract(NODE, TOKEN)).toBeUndefined();
  });

  it('knows nothing from an HTTP error without a JSON-RPC answer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ status: 502, json: async () => { throw new SyntaxError(); } })));

    expect(await fetchIsEvmContract(NODE, TOKEN)).toBeUndefined();
  });
});
