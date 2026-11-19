import { clearEvmTokenMetaCache, useEvmTokenMeta } from '@/protocols/evm/composables/evmTokenMeta';
import { PROTOCOLS } from '@/constants';
import { abiString, SELECTORS, word } from '../../../helpers/evmAbi';

const NODE = 'https://node.test';
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

const { knownTokens } = vi.hoisted(() => ({ knownTokens: {} as Record<string, any> }));

vi.mock('@/composables/fungibleTokens', () => ({
  useFungibleTokens: () => ({ getProtocolAvailableTokens: () => knownTokens }),
}));

let calls: string[];

function stubNode(isToken: boolean, hasSymbol = isToken) {
  calls = [];
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
    const { params } = JSON.parse(init.body as string);
    const selector = params[0].data.slice(0, 10);
    calls.push(selector);
    const answers: Record<string, string> = {
      ...isToken ? { [SELECTORS.decimals]: `0x${word(6n)}` } : {},
      ...hasSymbol ? { [SELECTORS.symbol]: abiString('USDC') } : {},
    };
    const result = answers[selector];
    return {
      status: 200,
      json: async () => (result ? { result } : { error: { code: 3, message: 'execution reverted' } }),
    };
  }));
}

describe('useEvmTokenMeta', () => {
  beforeEach(() => {
    clearEvmTokenMetaCache();
    Object.keys(knownTokens).forEach((key) => delete knownTokens[key]);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('asks the node once per token, also for calls at the same time', async () => {
    stubNode(true);
    const { getTokenMeta } = useEvmTokenMeta(PROTOCOLS.ethereum);

    const metas = await Promise.all([
      getTokenMeta(NODE, USDC),
      getTokenMeta(NODE, USDC.toLowerCase()),
    ]);
    await getTokenMeta(NODE, USDC);

    expect(metas).toEqual([{ symbol: 'USDC', decimals: 6 }, { symbol: 'USDC', decimals: 6 }]);
    expect(calls).toEqual([SELECTORS.decimals, SELECTORS.symbol]);
  });

  it('asks again where it learned of no token, as a failing node tells the same', async () => {
    stubNode(false);
    const { getTokenMeta } = useEvmTokenMeta(PROTOCOLS.ethereum);
    await getTokenMeta(NODE, USDC);
    stubNode(true);

    expect(await getTokenMeta(NODE, USDC)).toEqual({ symbol: 'USDC', decimals: 6 });
  });

  it('asks again where the symbol did not come, as from a node that limits the rate', async () => {
    stubNode(true, false);
    const { getTokenMeta } = useEvmTokenMeta(PROTOCOLS.ethereum);
    expect(await getTokenMeta(NODE, USDC)).toEqual({ decimals: 6 });
    stubNode(true);

    expect(await getTokenMeta(NODE, USDC)).toEqual({ symbol: 'USDC', decimals: 6 });
  });

  it('asks each node for itself', async () => {
    stubNode(true);
    const { getTokenMeta } = useEvmTokenMeta(PROTOCOLS.ethereum);
    await getTokenMeta(NODE, USDC);
    await getTokenMeta('https://other-node.test', USDC);

    expect(calls).toHaveLength(4);
  });

  it('takes a token of the token list without asking', async () => {
    stubNode(true);
    knownTokens[USDC] = { contractId: USDC, symbol: 'USDC.e', decimals: 6 };

    expect(await useEvmTokenMeta(PROTOCOLS.ethereum).getTokenMeta(NODE, USDC))
      .toEqual({ symbol: 'USDC.e', decimals: 6 });
    expect(calls).toEqual([]);
  });
});
