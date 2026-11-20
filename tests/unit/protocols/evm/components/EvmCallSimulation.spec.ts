import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';

import type { IEvmCall } from '@/types';
import EvmCallSimulation from '@/protocols/evm/components/EvmCallSimulation.vue';
import { clearEvmTokenMetaCache } from '@/protocols/evm/composables/evmTokenMeta';
import { PROTOCOLS } from '@/constants';
import en from '@/popup/locales/en-US.json';
import {
  abiString,
  batchData,
  callData,
  log,
  SELECTORS,
  TOPICS,
  word,
  words,
} from '../../../helpers/evmAbi';

// Checksummed, as the handler hands it over, while nodes write logs in lower case
const USER = '0xABCdeFaBCdeFaBcdEFAbcDeFabCdEFABCDef0001';
const ROUTER = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD';
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const BAYC = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const OTHER = '0x2222222222222222222222222222222222222222';
// A wallet contract that tells each coin it takes with WETH9's Deposit event
const MULTISIG = '0x4444444444444444444444444444444444444444';
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
// A fake USDC whose symbol carries the address of the real one
const FAKE = '0x7777777777777777777777777777777777777777';
const FAKE_SYMBOL = 'USDC (0xA0b8…eB48)';
// A token without the optional decimals(), as the node answers for none
const NO_DECIMALS = '0x5555555555555555555555555555555555555555';
const COIN = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const MAX_UINT256 = 2n ** 256n - 1n;
// swapExactETHForTokens of a router, which the call data alone doesn't tell
const SWAP_DATA = `0x7ff36ab5${'0'.repeat(64)}`;

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

let simulation: object;
let nodeRequests: any[];

beforeEach(() => {
  clearEvmTokenMetaCache();
  Object.keys(knownTokens).forEach((key) => delete knownTokens[key]);
  nodeRequests = [];
  settings.chainId = '1';
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
    const { method, params } = JSON.parse(init.body as string);
    nodeRequests.push({ method, params });
    let body: object = { error: { code: 3, message: 'execution reverted' } };
    const isDecimals = params[0].data?.startsWith(SELECTORS.decimals);
    if (method === 'eth_simulateV1') {
      body = simulation;
    } else if (params[0].to?.toLowerCase() === USDC.toLowerCase()) {
      body = { result: isDecimals ? `0x${word(6n)}` : abiString('USDC') };
    } else if (params[0].to?.toLowerCase() === WETH.toLowerCase()) {
      body = { result: isDecimals ? `0x${word(18n)}` : abiString('WETH') };
    } else if (
      params[0].to?.toLowerCase() === BAYC.toLowerCase()
      && params[0].data.startsWith(SELECTORS.symbol)
    ) {
      body = { result: abiString('BAYC') };
    } else if (params[0].to?.toLowerCase() === FAKE) {
      body = { result: isDecimals ? `0x${word(6n)}` : abiString(FAKE_SYMBOL) };
    }
    return { status: 200, json: async () => ({ jsonrpc: '2.0', id: 1, ...body }) };
  }));
});

afterEach(() => vi.unstubAllGlobals());

const ok = (logs: object[]) => ({ result: [{ calls: [{ status: '0x1', logs }] }] });

function mountSimulation(to = ROUTER, data = SWAP_DATA) {
  // With the fees, as the handler always sets them
  const evmCall: IEvmCall = {
    from: USER,
    to,
    value: '0x6f05b59d3b20000',
    data,
    gas: '0x30d40',
    chainId: '1',
    maxFeePerGas: '0x5d21dba00',
    maxPriorityFeePerGas: '0x3b9aca00',
  };
  return mount(EvmCallSimulation, {
    props: { protocol: PROTOCOLS.ethereum, evmCall },
    global: { plugins: [i18n] },
  });
}

const texts = (wrapper: any, dataCy: string) => wrapper
  .findAll(`[data-cy=${dataCy}]`).map((el: any) => el.text());

describe('EvmCallSimulation', () => {
  it('shows what the user sends and gets', async () => {
    simulation = ok([
      log(COIN, [TOPICS.transfer, USER, ROUTER], words(5n * 10n ** 17n)),
      log(USDC, [TOPICS.transfer, ROUTER, USER], words(1_234_500_000n)),
    ]);
    const wrapper = mountSimulation();
    await flushPromises();

    expect(wrapper.find('[data-cy=evm-call-simulation]').attributes('aria-busy')).toBe('false');
    expect(texts(wrapper, 'evm-call-change')).toEqual(['−0.5 ETH', `+1,234.5 USDC (${USDC})`]);
    expect(wrapper.find('.change.incoming').text()).toBe(`+1,234.5 USDC (${USDC})`);
    expect(wrapper.text()).toContain('Simulated on the latest block. The balance changes don\'t include the fee.');
    expect(texts(wrapper, 'evm-call-warning')).toEqual([]);
  });

  it('lists what leaves first, whatever the order of the events', async () => {
    simulation = ok([
      log(USDC, [TOPICS.transfer, ROUTER, USER], words(1_234_500_000n)),
      log(COIN, [TOPICS.transfer, USER, ROUTER], words(5n * 10n ** 17n)),
    ]);
    const wrapper = mountSimulation();
    await flushPromises();

    expect(texts(wrapper, 'evm-call-change')).toEqual(['−0.5 ETH', `+1,234.5 USDC (${USDC})`]);
  });

  // A fake can be made at an address that starts and ends as the real one
  it('tells the whole address of what comes in, also of a token on the token list', async () => {
    // A token of the list can be a fake the user got for free
    knownTokens[USDC] = { contractId: USDC, symbol: 'USDC', decimals: 6 };
    simulation = ok([
      log(USDC, [TOPICS.transfer, USER, ROUTER], words(1_000_000n)),
      log(USDC, [TOPICS.transfer, ROUTER, USER], words(3_000_000_000n)),
      log(BAYC, [TOPICS.transfer, ROUTER, USER, '0x2a']),
      log(NO_DECIMALS, [TOPICS.transfer, ROUTER, USER], words(7n)),
    ]);
    const wrapper = mountSimulation();
    await flushPromises();

    expect(texts(wrapper, 'evm-call-change')).toEqual([
      `+2,999 USDC (${USDC})`,
      `+BAYC #42 (${BAYC})`,
      `+7 base units of ${NO_DECIMALS}`,
    ]);
  });

  it('names what leaves by its symbol, or else by its short address', async () => {
    simulation = ok([
      log(USDC, [TOPICS.transfer, USER, ROUTER], words(1_000_000n)),
      log(NO_DECIMALS, [TOPICS.transfer, USER, ROUTER], words(7n)),
    ]);
    const wrapper = mountSimulation();
    await flushPromises();

    expect(texts(wrapper, 'evm-call-change')).toEqual(['−1 USDC', '−7 base units of 0x5555…5555']);
  });

  it('tells how many of an ERC-1155 item come in', async () => {
    simulation = ok([
      log(BAYC, [TOPICS.transferSingle, ROUTER, ROUTER, USER], words(7n, 3n)),
    ]);
    const wrapper = mountSimulation();
    await flushPromises();

    expect(texts(wrapper, 'evm-call-change')).toEqual([`+3 × BAYC #7 (${BAYC})`]);
  });

  it('tells each ERC-1155 item a batch takes', async () => {
    simulation = ok([
      log(BAYC, [TOPICS.transferBatch, ROUTER, USER, OTHER], batchData([7n, 8n], [3n, 1n])),
    ]);
    const wrapper = mountSimulation();
    await flushPromises();

    expect(texts(wrapper, 'evm-call-change')).toEqual(['−3 × BAYC #7', '−BAYC #8']);
    expect(texts(wrapper, 'evm-call-unread')).toEqual([]);
  });

  it.each([
    ['the node', false],
    ['the token list', true],
  ])('shows the address of what comes in for a symbol from %s that poses as one', async (_, isListed) => {
    if (isListed) knownTokens[FAKE] = { contractId: FAKE, symbol: FAKE_SYMBOL, decimals: 6 };
    simulation = ok([
      log(COIN, [TOPICS.transfer, USER, ROUTER], words(5n * 10n ** 17n)),
      log(FAKE, [TOPICS.transfer, ROUTER, USER], words(1_000_000_000n)),
    ]);
    const wrapper = mountSimulation();
    await flushPromises();

    expect(texts(wrapper, 'evm-call-change')).toEqual(['−0.5 ETH', `+1,000 ${FAKE}`]);
  });

  it('shows a wrap of the coin as the wrapped token coming in', async () => {
    simulation = ok([
      log(COIN, [TOPICS.transfer, USER, WETH], words(10n ** 18n)),
      log(WETH, [TOPICS.deposit, USER], words(10n ** 18n)),
    ]);
    const wrapper = mountSimulation(WETH, '0xd0e30db0');
    await flushPromises();

    expect(texts(wrapper, 'evm-call-change')).toEqual(['−1 ETH', `+1 WETH (${WETH})`]);
  });

  it('shows no wrap of a contract that is no token', async () => {
    simulation = ok([
      log(COIN, [TOPICS.transfer, USER, MULTISIG], words(10n ** 18n)),
      log(MULTISIG, [TOPICS.deposit, USER], words(10n ** 18n)),
    ]);
    const wrapper = mountSimulation(MULTISIG, '0x12345678');
    await flushPromises();

    expect(texts(wrapper, 'evm-call-change')).toEqual(['−1 ETH']);
  });

  it('tells a call that changes no balances', async () => {
    simulation = ok([]);
    const wrapper = mountSimulation();
    await flushPromises();

    expect(texts(wrapper, 'evm-call-simulation-note')).toEqual(['No balance changes']);
    expect(wrapper.findAll('.info-box')).toEqual([]);
  });

  it('warns of the changes it can not read, as of a transfer with the addresses in its data', async () => {
    simulation = ok([log(BAYC, [TOPICS.transfer], words(USER, ROUTER, 42n))]);
    const wrapper = mountSimulation();
    await flushPromises();

    expect(texts(wrapper, 'evm-call-unread')).toEqual(["Some changes of your assets can't be shown here."]);
    expect(wrapper.find('[data-cy=evm-call-unread]').classes()).toContain('warning');
  });

  it('warns of the approvals a call gives that its call data does not tell', async () => {
    simulation = ok([
      log(USDC, [TOPICS.approval, USER, ROUTER], words(MAX_UINT256)),
      log(BAYC, [TOPICS.approvalForAll, USER, ROUTER], words(1n)),
      log(BAYC, [TOPICS.approval, USER, OTHER, '0x7']),
    ]);
    const wrapper = mountSimulation();
    await flushPromises();

    expect(texts(wrapper, 'evm-call-approval')).toEqual([
      `Unlimited USDC to ${ROUTER}`,
      `All BAYC NFTs to ${ROUTER}`,
      `BAYC #7 to ${OTHER}`,
    ]);
    expect(texts(wrapper, 'evm-call-warning')).toEqual([
      'Unlimited approval: the spender can take all your USDC, now and later, until you revoke it.',
      'The operator can transfer all your NFTs of this collection, also the ones you get later.',
    ]);
  });

  it('tells an unlimited Permit2 allowance that expires', async () => {
    simulation = ok([
      log(
        PERMIT2,
        [TOPICS.permit2Approval, USER, USDC, ROUTER],
        words(2n ** 160n - 1n, 1795000000n),
      ),
    ]);
    const wrapper = mountSimulation();
    await flushPromises();

    expect(texts(wrapper, 'evm-call-warning')).toEqual([
      'Unlimited approval: the spender can take all your USDC until the approval expires.',
    ]);
  });

  it('tells twice the same unlimited approval once in the warnings', async () => {
    simulation = ok([
      log(USDC, [TOPICS.approval, USER, ROUTER], words(MAX_UINT256)),
      log(USDC, [TOPICS.approval, USER, OTHER], words(MAX_UINT256)),
    ]);
    const wrapper = mountSimulation();
    await flushPromises();

    expect(texts(wrapper, 'evm-call-approval')).toEqual([
      `Unlimited USDC to ${ROUTER}`,
      `Unlimited USDC to ${OTHER}`,
    ]);
    expect(texts(wrapper, 'evm-call-warning')).toEqual([
      'Unlimited approval: the spender can take all your USDC, now and later, until you revoke it.',
    ]);
  });

  it('shows the approvals a decoded call does not tell', async () => {
    // A transfer to a contract that uses a permit the user signed before
    simulation = ok([
      log(
        PERMIT2,
        [TOPICS.permit2Permit, USER, WETH, ROUTER],
        words(2n ** 160n - 1n, 1795000000n, 0n),
      ),
    ]);
    const wrapper = mountSimulation(USDC, callData(SELECTORS.transfer, ROUTER, 1n));
    await flushPromises();

    expect(texts(wrapper, 'evm-call-approval')).toEqual([`Unlimited WETH to ${ROUTER}`]);
  });

  it('leaves the approval of a decoded approve to the summary of it', async () => {
    simulation = ok([log(USDC, [TOPICS.approval, USER, ROUTER], words(MAX_UINT256))]);
    const wrapper = mountSimulation(USDC, callData(SELECTORS.approve, ROUTER, MAX_UINT256));
    await flushPromises();

    expect(texts(wrapper, 'evm-call-approval')).toEqual([]);
    expect(texts(wrapper, 'evm-call-warning')).toEqual([]);
    expect(texts(wrapper, 'evm-call-simulation-note')).toEqual(['No balance changes']);
  });

  it.each([
    [
      'an approve',
      USDC,
      callData(SELECTORS.approve, ROUTER, MAX_UINT256),
      [
        log(USDC, [TOPICS.approval, USER, ROUTER], words(MAX_UINT256)),
        log(USDC, [TOPICS.approval, USER, OTHER], words(5_000_000n)),
      ],
      `5 USDC to ${OTHER}`,
    ],
    [
      'an increaseAllowance',
      USDC,
      callData(SELECTORS.increaseAllowance, ROUTER, 5_000_000n),
      [
        log(USDC, [TOPICS.approval, USER, ROUTER], words(15_000_000n)),
        log(USDC, [TOPICS.approval, USER, OTHER], words(5_000_000n)),
      ],
      `5 USDC to ${OTHER}`,
    ],
    [
      'a setApprovalForAll',
      BAYC,
      callData(SELECTORS.setApprovalForAll, ROUTER, 1n),
      [
        log(BAYC, [TOPICS.approvalForAll, USER, ROUTER], words(1n)),
        log(BAYC, [TOPICS.approvalForAll, USER, OTHER], words(1n)),
      ],
      `All BAYC NFTs to ${OTHER}`,
    ],
    [
      'an approve of Permit2, but not the token\'s own approval',
      PERMIT2,
      callData(SELECTORS.permit2Approve, USDC, ROUTER, 2n ** 160n - 1n, 1795000000n),
      [
        log(
          PERMIT2,
          [TOPICS.permit2Approval, USER, USDC, ROUTER],
          words(2n ** 160n - 1n, 1795000000n),
        ),
        log(USDC, [TOPICS.approval, USER, ROUTER], words(5_000_000n)),
      ],
      `5 USDC to ${ROUTER}`,
    ],
    [
      'an approve, but not a Permit2 allowance of the token to the same spender',
      USDC,
      callData(SELECTORS.approve, ROUTER, 5_000_000n),
      [
        log(USDC, [TOPICS.approval, USER, ROUTER], words(5_000_000n)),
        log(
          PERMIT2,
          [TOPICS.permit2Approval, USER, USDC, ROUTER],
          words(2n ** 160n - 1n, 1795000000n),
        ),
      ],
      `Unlimited USDC to ${ROUTER}`,
    ],
    [
      'an approve of an NFT, but not all of the collection to the same operator',
      BAYC,
      callData(SELECTORS.approve, ROUTER, 7n),
      [
        log(BAYC, [TOPICS.approval, USER, ROUTER, '0x7']),
        log(BAYC, [TOPICS.approvalForAll, USER, ROUTER], words(1n)),
      ],
      `All BAYC NFTs to ${ROUTER}`,
    ],
  ])('shows the approvals of %s other than its own', async (_, to, data, logs, approval) => {
    simulation = ok(logs);
    const wrapper = mountSimulation(to, data);
    await flushPromises();

    expect(texts(wrapper, 'evm-call-approval')).toEqual([approval]);
  });

  it('warns of an unlimited approve of a token without decimals, which the summary can not', async () => {
    simulation = ok([log(NO_DECIMALS, [TOPICS.approval, USER, ROUTER], words(MAX_UINT256))]);
    const wrapper = mountSimulation(NO_DECIMALS, callData(SELECTORS.approve, ROUTER, MAX_UINT256));
    await flushPromises();

    // The summary names the spender
    expect(texts(wrapper, 'evm-call-approval')).toEqual([]);
    expect(texts(wrapper, 'evm-call-warning')).toEqual([
      'Unlimited approval: the spender can take all your 0x5555…5555, now and later, until you revoke it.',
    ]);
  });

  it('leaves the warning of a Permit2 approve to the summary, which needs no decimals', async () => {
    const amount = 2n ** 160n - 1n;
    simulation = ok([
      log(PERMIT2, [TOPICS.permit2Approval, USER, NO_DECIMALS, ROUTER], words(amount, 1795000000n)),
    ]);
    const wrapper = mountSimulation(
      PERMIT2,
      callData(SELECTORS.permit2Approve, NO_DECIMALS, ROUTER, amount, 1795000000n),
    );
    await flushPromises();

    expect(texts(wrapper, 'evm-call-approval')).toEqual([]);
    expect(texts(wrapper, 'evm-call-warning')).toEqual([]);
  });

  it('warns of a call that would fail', async () => {
    simulation = {
      result: [{
        calls: [{ status: '0x0', logs: [], error: { code: 3, message: 'execution reverted: EXPIRED' } }],
      }],
    };
    const wrapper = mountSimulation();
    await flushPromises();

    expect(texts(wrapper, 'evm-call-warning'))
      .toEqual(['This transaction would fail: execution reverted: EXPIRED']);
    expect(wrapper.text()).not.toContain('Estimated balance changes');
  });

  it('warns of a call that would fail without a reason', async () => {
    simulation = { result: [{ calls: [{ status: '0x0', logs: [] }] }] };
    const wrapper = mountSimulation();
    await flushPromises();

    expect(texts(wrapper, 'evm-call-warning')).toEqual(['This transaction would fail.']);
  });

  it('warns of a value the account does not have', async () => {
    simulation = { error: { code: -38014, message: 'insufficient funds for gas * price + value' } };
    const wrapper = mountSimulation();
    await flushPromises();

    expect(texts(wrapper, 'evm-call-warning'))
      .toEqual(['There is not enough ETH to pay for this transaction.']);
    // Nothing would change but what the warning tells
    expect(wrapper.text()).not.toContain('Estimated balance changes');
    expect(texts(wrapper, 'evm-call-simulation-note')).toEqual([]);
  });

  it('tells that the network can not preview, as on Avalanche', async () => {
    simulation = { error: { code: -32601, message: 'the method eth_simulateV1 does not exist' } };
    const wrapper = mountSimulation();
    await flushPromises();

    expect(texts(wrapper, 'evm-call-simulation-note'))
      .toEqual(["Balance changes can't be previewed on this network."]);
    expect(texts(wrapper, 'evm-call-warning')).toEqual([]);
  });

  it('tells that the preview failed when the node is down', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const wrapper = mountSimulation();
    await flushPromises();

    expect(texts(wrapper, 'evm-call-simulation-note'))
      .toEqual(["Couldn't preview the balance changes."]);
  });

  it('asks no node of another chain than the one of the request', async () => {
    settings.chainId = '56';
    const wrapper = mountSimulation();
    await flushPromises();

    expect(nodeRequests).toEqual([]);
    expect(texts(wrapper, 'evm-call-simulation-note'))
      .toEqual(["Couldn't preview the balance changes."]);
  });

  it('shows a placeholder while the node runs the call', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const wrapper = mountSimulation();
    await flushPromises();

    expect(texts(wrapper, 'evm-call-simulation-note')).toEqual(['…']);
    expect(wrapper.find('[data-cy=evm-call-simulation]').attributes('aria-busy')).toBe('true');
  });
});
