import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';

import type { IEvmCall } from '@/types';
import EvmCallSummary from '@/protocols/evm/components/EvmCallSummary.vue';
import { clearEvmTokenMetaCache } from '@/protocols/evm/composables/evmTokenMeta';
import { PERMIT2_ADDRESS } from '@/protocols/evm/helpers/decodeEvmCallIntent';
import { PROTOCOLS } from '@/constants';
import en from '@/popup/locales/en-US.json';
import {
  abiString,
  callData,
  SELECTORS,
  word,
} from '../../../helpers/evmAbi';

const NODE = 'https://node.test';
const USER = '0x1111111111111111111111111111111111111111';
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const BAYC = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
const EOA = '0x000000000000000000000000000000000000dEaD';
const ROUTER = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD';
// A token that answers 0 decimals, as an NFT may do for wallets
const PUNK = '0x6666666666666666666666666666666666666666';
const ZERO = `0x${'0'.repeat(40)}`;
const MAX_UINT256 = 2n ** 256n - 1n;

const { settings, knownTokens } = vi.hoisted(() => ({
  settings: { chainId: '1', nodeUrl: 'https://node.test' },
  knownTokens: {} as Record<string, any>,
}));

vi.mock('@/protocols/evm/helpers/activeEvmNetworkSettings', () => ({
  getActiveEvmNetworkSettings: () => settings,
}));
vi.mock('@/composables/fungibleTokens', () => ({
  useFungibleTokens: () => ({ getProtocolAvailableTokens: () => knownTokens }),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

enableAutoUnmount(afterEach);

const CONTRACTS: Record<string, Record<string, string | null>> = {
  [USDC.toLowerCase()]: { [SELECTORS.decimals]: `0x${word(6n)}`, [SELECTORS.symbol]: abiString('USDC') },
  [BAYC.toLowerCase()]: {
    [SELECTORS.decimals]: null,
    [SELECTORS.symbol]: abiString('BAYC'),
    [SELECTORS.supportsInterface]: `0x${word(1n)}`,
  },
  [PUNK]: { [SELECTORS.decimals]: `0x${word(0n)}`, [SELECTORS.symbol]: abiString('PUNK') },
};
const CODE: Record<string, string> = {
  [EOA.toLowerCase()]: '0x',
  [ROUTER.toLowerCase()]: '0x6080604052',
  [ZERO]: '0x',
};

let nodeRequests: any[];

function stubNode(isDown = false) {
  nodeRequests = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    const { method, params } = JSON.parse(init.body as string);
    nodeRequests.push({ url, method, params });
    if (isDown) throw new TypeError('Failed to fetch');
    const result = (method === 'eth_getCode')
      ? CODE[params[0].toLowerCase()]
      : CONTRACTS[params[0].to.toLowerCase()]?.[params[0].data.slice(0, 10)];
    return {
      status: 200,
      json: async () => (result == null
        ? { error: { code: 3, message: 'execution reverted' } }
        : { result }),
    };
  }));
}

function mountSummary(to: string, data: string) {
  const evmCall: IEvmCall = {
    from: USER, to, value: '0x0', data, gas: '0x186a0', chainId: '1',
  };
  return mount(EvmCallSummary, {
    props: { protocol: PROTOCOLS.ethereum, evmCall },
    global: { plugins: [i18n] },
  });
}

/** Each row as label and value, in the order the user reads them */
const rows = (wrapper: any): [string, string][] => wrapper
  .findAll('.details-item')
  .map((item: any) => [item.find('.label').text(), item.find('.value').text()]);
/** The value of the one row with `label` */
function row(wrapper: any, label: string) {
  const matches = rows(wrapper).filter(([itemLabel]) => itemLabel === label);
  expect(matches).toHaveLength(1);
  return matches[0][1];
}
const warnings = (wrapper: any) => wrapper
  .findAll('[data-cy=evm-call-warning]').map((el: any) => el.text());

describe('EvmCallSummary', () => {
  beforeEach(() => {
    clearEvmTokenMetaCache();
    stubNode();
    settings.chainId = '1';
    Object.keys(knownTokens).forEach((key) => delete knownTokens[key]);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('tells an unlimited approval to an account that is not a contract', async () => {
    const wrapper = mountSummary(USDC, callData(SELECTORS.approve, EOA, MAX_UINT256));
    await flushPromises();

    expect(wrapper.find('[data-cy=evm-call-summary]').attributes('aria-busy')).toBe('false');
    expect(rows(wrapper)).toEqual([
      ['Action', 'Allow spending tokens'], ['Amount', 'Unlimited USDC'], ['Spender', EOA],
    ]);
    expect(warnings(wrapper)).toEqual([
      'Unlimited approval: the spender can take all your USDC, now and later, until you revoke it.',
      'The spender is not a contract. Drainers often collect approvals with plain accounts.',
    ]);
  });

  it('tells a limited approval to a contract without warnings', async () => {
    const wrapper = mountSummary(USDC, callData(SELECTORS.approve, ROUTER, 1_500_000n));
    await flushPromises();

    expect(rows(wrapper)).toEqual([
      ['Action', 'Allow spending tokens'], ['Amount', '1.5 USDC'], ['Spender', ROUTER],
    ]);
    expect(warnings(wrapper)).toEqual([]);
  });

  it('tells an unlimited increase of an allowance', async () => {
    const wrapper = mountSummary(USDC, callData(SELECTORS.increaseAllowance, ROUTER, MAX_UINT256));
    await flushPromises();

    expect(rows(wrapper)).toEqual([
      ['Action', 'Allow spending more tokens'], ['Amount', 'Unlimited USDC'], ['Spender', ROUTER],
    ]);
    expect(warnings(wrapper)).toEqual([
      'Unlimited approval: the spender can take all your USDC, now and later, until you revoke it.',
    ]);
  });

  it('tells the amount and the recipient of a token transfer', async () => {
    const wrapper = mountSummary(USDC, callData(SELECTORS.transfer, EOA, 1_000_000_000n));
    await flushPromises();

    expect(rows(wrapper)).toEqual([
      ['Action', 'Send tokens'], ['Amount', '1,000 USDC'], ['Recipient', EOA],
    ]);
    expect(warnings(wrapper)).toEqual([]);
    // A transfer grants nothing, so no one's code is looked up
    expect(nodeRequests.map(({ method }) => method)).not.toContain('eth_getCode');
  });

  it.each([
    ['tokens', USDC, 2_500_000n, [['Action', 'Move tokens'], ['Amount', '2.5 USDC']]],
    // ERC-721 has the same selector
    ['an NFT', BAYC, 7n, [['Action', 'Move an NFT'], ['NFT', 'BAYC #7']]],
  ])('tells a transferFrom of %s with both accounts', async (_, to, amount, told) => {
    const wrapper = mountSummary(to, callData(SELECTORS.transferFrom, ROUTER, EOA, amount));
    await flushPromises();

    expect(rows(wrapper)).toEqual([...told, ['From', ROUTER], ['Recipient', EOA]]);
    expect(warnings(wrapper)).toEqual([]);
  });

  it.each([
    ['transfer', callData(SELECTORS.transfer, EOA, 2n ** 255n)],
    ['transferFrom', callData(SELECTORS.transferFrom, ROUTER, EOA, 2n ** 255n)],
  ])('tells the full amount of a huge %s, which moves no more than that', async (_, data) => {
    const wrapper = mountSummary(USDC, data);
    await flushPromises();

    expect(row(wrapper, 'Amount')).toBe('57,896,044,618,658,097,711,785,492,504,343,953,926,634,992,332,820,282,019,728,792,003,956,564.819968 USDC');
  });

  it.each([
    ['an ERC-721', callData(SELECTORS.safeTransferFrom, USER, EOA, 42n), 'BAYC #42'],
    ['3 of an ERC-1155', callData(SELECTORS.erc1155SafeTransferFrom, USER, EOA, 42n, 3n, 160n, 0n), '3 × BAYC #42'],
  ])('tells a sent NFT, %s', async (_, data, nft) => {
    const wrapper = mountSummary(BAYC, data);
    await flushPromises();

    expect(rows(wrapper)).toEqual([
      ['Action', 'Send an NFT'], ['NFT', nft], ['From', USER], ['Recipient', EOA],
    ]);
  });

  it('warns of tokens sent to the token contract', async () => {
    const wrapper = mountSummary(USDC, callData(SELECTORS.transfer, USDC, 1n));
    await flushPromises();

    expect(warnings(wrapper))
      .toEqual(['The tokens go to the token contract itself, where they are usually lost.']);
  });

  it('tells an approval of all NFTs of a collection', async () => {
    const wrapper = mountSummary(BAYC, callData(SELECTORS.setApprovalForAll, EOA, 1n));
    await flushPromises();

    expect(rows(wrapper)).toEqual([
      ['Action', 'Allow transferring all NFTs of a collection'],
      ['Collection', 'BAYC'],
      ['Operator', EOA],
    ]);
    expect(warnings(wrapper)).toEqual([
      'The operator can transfer all your NFTs of this collection, also the ones you get later.',
      'The operator is not a contract. Drainers often collect approvals with plain accounts.',
    ]);
  });

  it('tells a revoked approval of all NFTs without warnings', async () => {
    const wrapper = mountSummary(BAYC, callData(SELECTORS.setApprovalForAll, EOA, 0n));
    await flushPromises();

    expect(row(wrapper, 'Action')).toBe('Remove the approval for all NFTs of a collection');
    expect(warnings(wrapper)).toEqual([]);
  });

  it('tells an ERC-721 approve by its token id, not as an unlimited amount', async () => {
    const tokenId = 2n ** 200n;
    const wrapper = mountSummary(BAYC, callData(SELECTORS.approve, ROUTER, tokenId));
    await flushPromises();

    expect(rows(wrapper)).toEqual([
      ['Action', 'Allow transferring an NFT'], ['NFT', `BAYC #${tokenId}`], ['Spender', ROUTER],
    ]);
    expect(warnings(wrapper)).toEqual([]);
  });

  it.each([
    ['an allowance to an account', USDC, callData(SELECTORS.approve, EOA, 0n), [['Amount', '0 USDC'], ['Spender', EOA]]],
    [
      'a Permit2 allowance',
      PERMIT2_ADDRESS,
      callData(SELECTORS.permit2Approve, USDC, EOA, 0n, 0n),
      // Permit2 takes 0 for the time of the block the approval is in
      [['Amount', '0 USDC'], ['Spender', EOA], ['Expires', 'In this block only']],
    ],
    ['the approval of an NFT', BAYC, callData(SELECTORS.approve, ZERO, 42n), [['NFT', 'BAYC #42'], ['Spender', ZERO]]],
  ])('tells a revoke of %s, without warnings', async (_, to, data, told) => {
    const wrapper = mountSummary(to, data);
    await flushPromises();

    expect(rows(wrapper)).toEqual([['Action', 'Remove the approval'], ...told]);
    expect(warnings(wrapper)).toEqual([]);
    // The zero address gets no right, so its code isn't looked up
    expect(nodeRequests.filter(({ method, params }) => (
      method === 'eth_getCode' && BigInt(params[0]) === 0n
    ))).toEqual([]);
  });

  it.each([
    // Many collections start at #0
    ['NFT #0 approved', BAYC, 'Allow transferring an NFT'],
    ['an approve of 0 of a token with 0 decimals, which may name NFT #0', PUNK, 'Allow spending tokens'],
  ])('warns of %s to an account', async (_, to, action) => {
    const wrapper = mountSummary(to, callData(SELECTORS.approve, EOA, 0n));
    await flushPromises();

    expect(row(wrapper, 'Action')).toBe(action);
    expect(warnings(wrapper)).toEqual([
      'The spender is not a contract. Drainers often collect approvals with plain accounts.',
    ]);
  });

  it('tells an approve of Permit2 with its expiration', async () => {
    const data = callData(SELECTORS.permit2Approve, USDC, ROUTER, 2n ** 160n - 1n, 1795000000n);
    const wrapper = mountSummary(PERMIT2_ADDRESS, data);
    await flushPromises();

    expect(rows(wrapper)).toEqual([
      ['Action', 'Allow spending tokens through Permit2'],
      ['Amount', 'Unlimited USDC'],
      ['Spender', ROUTER],
      ['Expires', new Date(1795000000 * 1000).toLocaleString()],
    ]);
    expect(warnings(wrapper)).toEqual([
      'Unlimited approval: the spender can take all your USDC until the approval expires.',
    ]);
  });

  it('takes the token from the token list, without asking the node', async () => {
    knownTokens[USDC] = { contractId: USDC, symbol: 'USDC.e', decimals: 6 };
    const wrapper = mountSummary(USDC, callData(SELECTORS.transfer, EOA, 2_000_000n));
    await flushPromises();

    expect(row(wrapper, 'Amount')).toBe('2 USDC.e');
    expect(nodeRequests).toEqual([]);
  });

  it('shows the base units and no guesses when the node is down', async () => {
    stubNode(true);
    const wrapper = mountSummary(USDC, callData(SELECTORS.approve, EOA, MAX_UINT256));
    await flushPromises();

    expect(row(wrapper, 'Amount')).toBe(`${MAX_UINT256} base units of 0xA0b8…eB48`);
    expect(warnings(wrapper)).toEqual([]);
  });

  describe('while the node has not answered', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    });

    it('warns at once of what needs no lookup, with the address for the symbol', async () => {
      const permit2 = mountSummary(
        PERMIT2_ADDRESS,
        callData(SELECTORS.permit2Approve, USDC, ROUTER, 2n ** 160n - 1n, 1795000000n),
      );
      const approveAll = mountSummary(BAYC, callData(SELECTORS.setApprovalForAll, EOA, 1n));
      const toToken = mountSummary(USDC, callData(SELECTORS.transfer, USDC, 1n));
      await flushPromises();

      expect(warnings(permit2)).toEqual([
        'Unlimited approval: the spender can take all your 0xA0b8…eB48 until the approval expires.',
      ]);
      expect(warnings(approveAll)).toEqual([
        'The operator can transfer all your NFTs of this collection, also the ones you get later.',
      ]);
      expect(warnings(toToken))
        .toEqual(['The tokens go to the token contract itself, where they are usually lost.']);
    });

    it('waits for the decimals before an unlimited approve, which may name an NFT', async () => {
      const wrapper = mountSummary(USDC, callData(SELECTORS.approve, EOA, MAX_UINT256));
      await flushPromises();

      expect(wrapper.find('[data-cy=evm-call-summary]').attributes('aria-busy')).toBe('true');
      expect(row(wrapper, 'Amount')).toBe('…');
      expect(warnings(wrapper)).toEqual([]);
    });

    it('calls an approve of 0 a revoke only once the decimals tell', async () => {
      const wrapper = mountSummary(USDC, callData(SELECTORS.approve, EOA, 0n));
      await flushPromises();

      expect(row(wrapper, 'Action')).toBe('Allow spending tokens');
      expect(warnings(wrapper)).toEqual([]);
    });
  });

  it('asks no node of another chain than the one of the request', async () => {
    settings.chainId = '56';
    const wrapper = mountSummary(USDC, callData(SELECTORS.transfer, EOA, 1000n));
    await flushPromises();

    expect(nodeRequests).toEqual([]);
    expect(row(wrapper, 'Amount')).toBe('1000 base units of 0xA0b8…eB48');
  });

  it('shows nothing for a call it does not know', async () => {
    const wrapper = mountSummary(USDC, callData('0x38ed1739', 1n, 2n));
    await flushPromises();

    expect(wrapper.find('[data-cy=evm-call-summary]').exists()).toBe(false);
    expect(nodeRequests).toEqual([]);
  });

  it('asks the node of the active network', async () => {
    mountSummary(USDC, callData(SELECTORS.approve, ROUTER, 1n));
    await flushPromises();

    expect(new Set(nodeRequests.map(({ url }) => url))).toEqual(new Set([NODE]));
  });
});
