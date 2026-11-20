import { defineComponent, h } from 'vue';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';

import type { IEvmCall } from '@/types';
import EvmCallSimulation from '@/protocols/evm/components/EvmCallSimulation.vue';
import EvmCallSummary from '@/protocols/evm/components/EvmCallSummary.vue';
import { clearEvmTokenMetaCache } from '@/protocols/evm/composables/evmTokenMeta';
import { PROTOCOLS } from '@/constants';
import en from '@/popup/locales/en-US.json';
import {
  abiString,
  callData,
  log,
  SELECTORS,
  TOPICS,
  word,
  words,
} from '../../../helpers/evmAbi';

const USER = '0xABCdeFaBCdeFaBcdEFAbcDeFabCdEFABCDef0001';
const ROUTER = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD';
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const NO_DECIMALS = '0x5555555555555555555555555555555555555555';
const MAX_UINT256 = 2n ** 256n - 1n;

const { settings } = vi.hoisted(() => ({
  settings: { chainId: '1', nodeUrl: 'https://node.test' },
}));

vi.mock('@/protocols/evm/helpers/activeEvmNetworkSettings', () => ({
  getActiveEvmNetworkSettings: () => settings,
}));
vi.mock('@/composables/fungibleTokens', () => ({
  useFungibleTokens: () => ({ getProtocolAvailableTokens: () => ({}) }),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

enableAutoUnmount(afterEach);

const unlimited = (symbol: string) => `Unlimited approval: the spender can take all your ${symbol}, now and later, until you revoke it.`;

/** The node, which answers the simulation only once the test releases it */
function stubNode(token: string, answerDecimals: (callIdx: number) => object) {
  let release!: () => void;
  const simulated = new Promise<void>((resolve) => { release = resolve; });
  let decimalsCalls = 0;
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
    const { method, params } = JSON.parse(init.body as string);
    let body: object = { error: { code: 3, message: 'execution reverted' } };
    if (method === 'eth_simulateV1') {
      await simulated;
      body = {
        result: [{
          calls: [{
            status: '0x1',
            logs: [log(token, [TOPICS.approval, USER, ROUTER], words(MAX_UINT256))],
          }],
        }],
      };
    } else if (method === 'eth_getCode') {
      body = { result: '0x60' };
    } else if (token === USDC && params[0].data.startsWith(SELECTORS.decimals)) {
      body = answerDecimals(decimalsCalls);
      decimalsCalls += 1;
    } else if (token === USDC && params[0].data.startsWith(SELECTORS.symbol)) {
      body = { result: abiString('USDC') };
    }
    return { status: 200, json: async () => ({ jsonrpc: '2.0', id: 1, ...body }) };
  }));
  return release;
}

/** Both, on one request, as the confirmation shows them */
function mountBoth(token: string) {
  const evmCall: IEvmCall = {
    from: USER,
    to: token,
    value: '0x0',
    data: callData(SELECTORS.approve, ROUTER, MAX_UINT256),
    gas: '0x30d40',
    chainId: '1',
    maxFeePerGas: '0x5d21dba00',
    maxPriorityFeePerGas: '0x3b9aca00',
  };
  return mount(defineComponent({
    setup: () => () => [
      h(EvmCallSummary, { protocol: PROTOCOLS.ethereum, evmCall }),
      h(EvmCallSimulation, { protocol: PROTOCOLS.ethereum, evmCall }),
    ],
  }), { global: { plugins: [i18n] } });
}

const warningsOf = (wrapper: any, part: string) => wrapper
  .findAll(`[data-cy=${part}] [data-cy=evm-call-warning]`).map((el: any) => el.text());

describe('EvmCallSummary with EvmCallSimulation', () => {
  beforeEach(() => clearEvmTokenMetaCache());

  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ['the node tells the decimals', USDC, () => ({ result: `0x${word(6n)}` }), [unlimited('USDC')], []],
    [
      // The simulation asks after the summary has settled
      'the first lookup of the decimals fails',
      USDC,
      (callIdx: number) => ((callIdx === 0)
        ? { error: { code: -32005, message: 'rate limit exceeded' } }
        : { result: `0x${word(6n)}` }),
      [],
      [unlimited('USDC')],
    ],
    ['the token has no decimals', NO_DECIMALS, () => ({}), [], [unlimited('0x5555…5555')]],
  ])('warns once of an unlimited approve where %s', async (_, token, answerDecimals, inSummary, inSimulation) => {
    const release = stubNode(token, answerDecimals);
    const wrapper = mountBoth(token);
    await flushPromises();
    release();
    await flushPromises();

    expect(warningsOf(wrapper, 'evm-call-summary')).toEqual(inSummary);
    expect(warningsOf(wrapper, 'evm-call-simulation')).toEqual(inSimulation);
  });
});
