import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';

import type { IEvmTypedData } from '@/types';
import EvmTypedDataSummary from '@/protocols/evm/components/EvmTypedDataSummary.vue';
import { clearEvmTokenMetaCache } from '@/protocols/evm/composables/evmTokenMeta';
import { PERMIT2_ADDRESS } from '@/protocols/evm/helpers/decodeEvmCallIntent';
import { getSignedTypedData } from '@/protocols/evm/helpers/hashTypedData';
import { PROTOCOLS } from '@/constants';
import en from '@/popup/locales/en-US.json';
import { abiString, SELECTORS, word } from '../../../helpers/evmAbi';

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const OWNER = '0x1111111111111111111111111111111111111111';
const EOA = '0x000000000000000000000000000000000000dEaD';
const ROUTER = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD';
const MAX_UINT256 = (2n ** 256n - 1n).toString();
const DEADLINE = new Date(1795000000 * 1000).toLocaleString();

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

const TOKENS: Record<string, Record<string, string>> = {
  [USDC.toLowerCase()]: { [SELECTORS.decimals]: `0x${word(6n)}`, [SELECTORS.symbol]: abiString('USDC') },
  [DAI.toLowerCase()]: { [SELECTORS.decimals]: `0x${word(18n)}`, [SELECTORS.symbol]: abiString('DAI') },
};
const CODE: Record<string, string> = { [EOA.toLowerCase()]: '0x', [ROUTER.toLowerCase()]: '0x60' };

let nodeRequests: any[];

beforeEach(() => {
  clearEvmTokenMetaCache();
  nodeRequests = [];
  settings.chainId = '1';
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
    const { method, params } = JSON.parse(init.body as string);
    nodeRequests.push({ method, params });
    const result = (method === 'eth_getCode')
      ? CODE[params[0].toLowerCase()]
      : TOKENS[params[0].to.toLowerCase()]?.[params[0].data.slice(0, 10)];
    return {
      status: 200,
      json: async () => (result ? { result } : { error: { code: 3, message: 'reverted' } }),
    };
  }));
});

afterEach(() => vi.unstubAllGlobals());

const domainType = (...names: string[]) => names.map((name) => ({
  name,
  type: {
    name: 'string', version: 'string', chainId: 'uint256', verifyingContract: 'address',
  }[name]!,
}));
const PERMIT2_DOMAIN_TYPE = domainType('name', 'chainId', 'verifyingContract');

const PERMIT_TYPES = {
  EIP712Domain: domainType('name', 'version', 'chainId', 'verifyingContract'),
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};

function permit(spender: string, value: string, deadline = '1795000000'): IEvmTypedData {
  return {
    types: PERMIT_TYPES,
    primaryType: 'Permit',
    domain: {
      name: 'USD Coin', version: '2', chainId: 1, verifyingContract: USDC,
    },
    message: {
      owner: OWNER, spender, value, nonce: 0, deadline,
    },
  };
}

function permitBatch(
  details: { token: string; amount: string; expiration?: string }[],
): IEvmTypedData {
  return {
    types: {
      EIP712Domain: PERMIT2_DOMAIN_TYPE,
      PermitBatch: [
        { name: 'details', type: 'PermitDetails[]' },
        { name: 'spender', type: 'address' },
        { name: 'sigDeadline', type: 'uint256' },
      ],
      PermitDetails: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint160' },
        { name: 'expiration', type: 'uint48' },
        { name: 'nonce', type: 'uint48' },
      ],
    },
    primaryType: 'PermitBatch',
    domain: { name: 'Permit2', chainId: '1', verifyingContract: PERMIT2_ADDRESS },
    message: {
      details: details.map((detail) => ({ expiration: '1795000000', nonce: '0', ...detail })),
      spender: ROUTER,
      sigDeadline: '1795000000',
    },
  };
}

function permitTransfer(primaryType: string, extraTypes: object, message: object): IEvmTypedData {
  return {
    types: {
      EIP712Domain: PERMIT2_DOMAIN_TYPE,
      TokenPermissions: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }],
      ...extraTypes,
    },
    primaryType,
    domain: { name: 'Permit2', chainId: '1', verifyingContract: PERMIT2_ADDRESS },
    message: {
      spender: ROUTER, nonce: '1', deadline: '1795000000', ...message,
    },
  };
}

const TRANSFER_FIELDS = [
  { name: 'permitted', type: 'TokenPermissions' },
  { name: 'spender', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
];

const MAX_UINT160 = (2n ** 160n - 1n).toString();

/** EIP-3009, as USDC takes it */
function transferAuthorization(to: string, value: string): IEvmTypedData {
  return {
    types: {
      EIP712Domain: PERMIT_TYPES.EIP712Domain,
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
      ],
    },
    primaryType: 'TransferWithAuthorization',
    domain: {
      name: 'USD Coin', version: '2', chainId: 1, verifyingContract: USDC,
    },
    message: {
      from: OWNER, to, value, validAfter: 0, validBefore: 1795000000, nonce: `0x${'ab'.repeat(32)}`,
    },
  };
}

/** As the handler hands it over: only the declared fields are signed and shown */
const asSigned = (typedData: IEvmTypedData) => ({
  types: typedData.types,
  ...getSignedTypedData(typedData as any),
}) as IEvmTypedData;

function mountSummary(typedData: IEvmTypedData) {
  return mount(EvmTypedDataSummary, {
    props: { protocol: PROTOCOLS.ethereum, typedData: asSigned(typedData) },
    global: { plugins: [i18n] },
  });
}

/** Each row as its label and value, as the user reads them */
const rows = (wrapper: any): [string, string][] => wrapper.findAll('.details-item')
  .map((item: any) => [item.find('.label').text(), item.find('.value').text()]);
const valuesOf = (wrapper: any, label: string) => rows(wrapper)
  .filter(([name]) => name === label)
  .map(([, value]) => value);
const warnings = (wrapper: any) => wrapper
  .findAll('[data-cy=evm-sign-warning]').map((el: any) => el.text());

describe('EvmTypedDataSummary', () => {
  it('tells an unlimited permit to an account that is not a contract', async () => {
    const wrapper = mountSummary(permit(EOA, MAX_UINT256, MAX_UINT256));
    await flushPromises();

    expect(wrapper.find('[data-cy=evm-sign-summary]').attributes('aria-busy')).toBe('false');
    expect(rows(wrapper)).toEqual([
      ['Action', 'Allow spending tokens'],
      ['Amount', 'Unlimited USDC'],
      ['Spender', EOA],
      ['Signature valid until', 'Never'],
    ]);
    expect(warnings(wrapper)).toEqual([
      'Unlimited approval: the spender can take all your USDC, now and later, until you revoke it.',
      'The spender is not a contract. Drainers often collect approvals with plain accounts.',
    ]);
  });

  it('tells a limited permit to a contract without warnings', async () => {
    const wrapper = mountSummary(permit(ROUTER, '2500000'));
    await flushPromises();

    expect(rows(wrapper)).toEqual([
      ['Action', 'Allow spending tokens'],
      ['Amount', '2.5 USDC'],
      ['Spender', ROUTER],
      ['Signature valid until', DEADLINE],
    ]);
    expect(warnings(wrapper)).toEqual([]);
  });

  it('tells a permit of 0 to an account as a revoke, without warnings', async () => {
    const wrapper = mountSummary(permit(EOA, '0'));
    await flushPromises();

    expect(rows(wrapper)).toEqual([
      ['Action', 'Remove the approval'],
      ['Amount', '0 USDC'],
      ['Spender', EOA],
      ['Signature valid until', DEADLINE],
    ]);
    expect(warnings(wrapper)).toEqual([]);
  });

  it('tells a Permit2 allowance of each token with its expiration', async () => {
    const wrapper = mountSummary(permitBatch([
      { token: USDC, amount: MAX_UINT160 },
      // Permit2 starts it in the block the spender submits the signature in
      { token: DAI, amount: '1500000000000000000', expiration: '0' },
    ]));
    await flushPromises();

    expect(rows(wrapper)).toEqual([
      ['Action', 'Allow spending tokens through Permit2'],
      ['Amount', 'Unlimited USDC'],
      ['Expires', DEADLINE],
      ['Amount', '1.5 DAI'],
      ['Expires', 'Only in the block where the spender uses this signature'],
      ['Spender', ROUTER],
      ['Signature valid until', DEADLINE],
    ]);
    expect(warnings(wrapper)).toEqual([
      'Unlimited approval: the spender can take all your USDC until the approval expires.',
    ]);
  });

  it('warns of an unlimited Permit2 allowance written in binary, as it is signed', async () => {
    const wrapper = mountSummary(permitBatch([
      { token: USDC.slice(2), amount: `0b${'1'.repeat(160)}` },
    ]));
    await flushPromises();

    expect(valuesOf(wrapper, 'Amount')).toEqual(['Unlimited USDC']);
    expect(warnings(wrapper)).toEqual([
      'Unlimited approval: the spender can take all your USDC until the approval expires.',
    ]);
  });

  it('tells a one-time Permit2 transfer and the order it confirms', async () => {
    const wrapper = mountSummary(permitTransfer('PermitWitnessTransferFrom', {
      PermitWitnessTransferFrom: [...TRANSFER_FIELDS, { name: 'witness', type: 'Order' }],
      Order: [{ name: 'id', type: 'uint256' }],
    }, {
      permitted: { token: USDC, amount: '5000000' },
      witness: { id: '1' },
    }));
    await flushPromises();

    expect(rows(wrapper)).toEqual([
      ['Action', 'Allow a one-time transfer through Permit2'],
      ['Amount', '5 USDC'],
      ['Spender', ROUTER],
      ['Signature valid until', DEADLINE],
    ]);
    expect(wrapper.find('[data-cy=evm-sign-order]').exists()).toBe(true);
    expect(warnings(wrapper)).toEqual([]);
  });

  it('warns of a one-time Permit2 transfer of all the tokens', async () => {
    const wrapper = mountSummary(permitTransfer('PermitTransferFrom', {
      PermitTransferFrom: TRANSFER_FIELDS,
    }, {
      permitted: { token: USDC, amount: MAX_UINT256 },
    }));
    await flushPromises();

    expect(valuesOf(wrapper, 'Amount')).toEqual(['Unlimited USDC']);
    expect(wrapper.find('[data-cy=evm-sign-order]').exists()).toBe(false);
    expect(warnings(wrapper)).toEqual(['The spender can take all your USDC with this signature.']);
  });

  it('tells a DAI permit that allows all, and one that revokes, both never expiring', async () => {
    const daiPermit = (allowed: boolean): IEvmTypedData => ({
      types: {
        EIP712Domain: domainType('chainId', 'verifyingContract'),
        Permit: [
          { name: 'holder', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'nonce', type: 'uint256' },
          { name: 'expiry', type: 'uint256' },
          { name: 'allowed', type: 'bool' },
        ],
      },
      primaryType: 'Permit',
      domain: { chainId: 1, verifyingContract: DAI },
      message: {
        holder: OWNER, spender: ROUTER, nonce: 0, expiry: 0, allowed,
      },
    });
    const allowing = mountSummary(daiPermit(true));
    const revoking = mountSummary(daiPermit(false));
    await flushPromises();

    expect(rows(allowing)).toEqual([
      ['Action', 'Allow spending tokens'],
      ['Amount', 'Unlimited DAI'],
      ['Spender', ROUTER],
      // DAI takes an expiry of 0 for none
      ['Signature valid until', 'Never'],
    ]);
    expect(warnings(allowing)).toEqual([
      'Unlimited approval: the spender can take all your DAI, now and later, until you revoke it.',
    ]);
    expect(rows(revoking)).toEqual([
      ['Action', 'Remove the approval'],
      ['Spender', ROUTER],
      ['Signature valid until', 'Never'],
    ]);
    expect(warnings(revoking)).toEqual([]);
  });

  it('tells a transfer authorization of USDC to its recipient, an account', async () => {
    const wrapper = mountSummary(transferAuthorization(EOA, '5000000000'));
    await flushPromises();

    expect(rows(wrapper)).toEqual([
      ['Action', 'Send tokens'],
      ['Amount', '5,000 USDC'],
      ['Recipient', EOA],
      ['Signature valid until', DEADLINE],
    ]);
    expect(wrapper.find('[data-cy=evm-sign-recipient]').text()).toContain(EOA);
    // Paying an account is what it is for
    expect(warnings(wrapper)).toEqual([]);
    expect(nodeRequests.map(({ method }) => method)).not.toContain('eth_getCode');
  });

  it('tells the amount of a transfer authorization in full, also far above any supply', async () => {
    const wrapper = mountSummary(transferAuthorization(EOA, `1${'0'.repeat(40)}`));
    await flushPromises();

    expect(valuesOf(wrapper, 'Amount')).toEqual([`10${',000'.repeat(11)} USDC`]);
    expect(warnings(wrapper)).toEqual([]);
  });

  it('warns once of a token a batch names twice', async () => {
    const wrapper = mountSummary(permitBatch([
      { token: USDC, amount: MAX_UINT160 },
      { token: USDC, amount: MAX_UINT160 },
    ]));
    await flushPromises();

    expect(valuesOf(wrapper, 'Amount')).toEqual(['Unlimited USDC', 'Unlimited USDC']);
    expect(warnings(wrapper)).toEqual([
      'Unlimited approval: the spender can take all your USDC until the approval expires.',
    ]);
  });

  it('warns of an unlimited amount before the node answers, with the address for the symbol', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const wrapper = mountSummary(permit(EOA, MAX_UINT256));
    await flushPromises();

    expect(wrapper.find('[data-cy=evm-sign-summary]').attributes('aria-busy')).toBe('true');
    expect(valuesOf(wrapper, 'Amount')).toEqual(['…']);
    // The spender is told no contract only once the node says so
    expect(warnings(wrapper)).toEqual([
      'Unlimited approval: the spender can take all your 0xA0b8…eB48, now and later, until you revoke it.',
    ]);
  });

  it.each([
    ['in hex', { chainId: '0x1' }, domainType('chainId', 'verifyingContract')],
    ['not named', {}, domainType('verifyingContract')],
  ])('asks the node where the chain of the domain is %s', async (_, chain, domainTypes) => {
    const signed = permit(EOA, MAX_UINT256);
    const wrapper = mountSummary({
      ...signed,
      types: { ...signed.types, EIP712Domain: domainTypes },
      domain: { ...chain, verifyingContract: USDC },
    });
    await flushPromises();

    expect(nodeRequests.map(({ method }) => method)).toContain('eth_getCode');
    expect(valuesOf(wrapper, 'Amount')).toEqual(['Unlimited USDC']);
    expect(warnings(wrapper)).toContain(
      'The spender is not a contract. Drainers often collect approvals with plain accounts.',
    );
  });

  it('asks no node of another chain than the one of the domain', async () => {
    settings.chainId = '56';
    const wrapper = mountSummary(permit(EOA, '1000'));
    await flushPromises();

    expect(nodeRequests).toEqual([]);
    expect(valuesOf(wrapper, 'Amount')).toEqual(['1000 base units of 0xA0b8…eB48']);
  });

  it('shows nothing for other typed data', async () => {
    const wrapper = mountSummary({
      types: {
        EIP712Domain: domainType('chainId', 'verifyingContract'),
        Mail: [{ name: 'contents', type: 'string' }],
      },
      primaryType: 'Mail',
      domain: { chainId: 1, verifyingContract: USDC },
      message: { contents: 'Hello' },
    });
    await flushPromises();

    expect(wrapper.find('[data-cy=evm-sign-summary]').exists()).toBe(false);
    expect(nodeRequests).toEqual([]);
  });
});
