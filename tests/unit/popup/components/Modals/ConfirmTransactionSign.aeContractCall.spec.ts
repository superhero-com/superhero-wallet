/**
 * [BLACK-BOX] What the confirmation modal shows when an aepp asks to sign a call to the
 * DEX or to a token. The calls are encoded as a dapp does, the router's from its ACI.
 * The modal decodes them with the bytecode the mainnet node serves for that contract.
 *
 * tests/fixtures/aeDex.json holds that bytecode, from mainnet.aeternity.io/v3/contracts/{id}/code,
 * and deployment/aci/AedexV2Router.aci.json of aeternity/dex-contracts-v2 cut down to the
 * swap and liquidity entrypoints.
 *
 * Faked: the wallet's accounts, the node, middleware and token sales answers, and the SDK's
 * balance and dry run. The header, the raw call data and the account picker are stubbed.
 */
import { ref } from 'vue';
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils';
import {
  MemoryAccount,
  Tag,
  buildTx,
  unpackTx,
  type Encoded,
} from '@aeternity/aepp-sdk';
import {
  AciContractCallEncoder,
  BytecodeContractCallEncoder,
  ContractByteArrayEncoder,
  TypeResolver,
} from '@aeternity/aepp-calldata';

import '@/protocols/registerAdapters';
import { PROTOCOLS } from '@/constants';
import { createAppData } from '@/utils';
import { i18n, tg } from '@/popup/plugins/i18n';
import { usePopupProps } from '@/composables/popupProps';
import { AE_NETWORK_MAINNET_ID } from '@/protocols/aeternity/config';
import ConfirmTransactionSign from '@/popup/components/Modals/ConfirmTransactionSign.vue';
import dex from '../../../../fixtures/aeDex.json';

// The setup files already loaded the composables with the real deps; reload them to apply mocks.
const { realAccounts, realAeSdk, sdk } = vi.hoisted(() => {
  vi.resetModules();
  return {
    realAccounts: { useAccounts: () => ({}) },
    realAeSdk: { useAeSdk: () => ({}) as any },
    sdk: {
      getBalance: vi.fn(),
      api: { getAccountByPubkey: vi.fn() },
      txDryRun: vi.fn(),
    },
  };
});

const CALLER = MemoryAccount.generate().address;
const callerAccount = {
  protocol: PROTOCOLS.aeternity,
  address: CALLER,
  idx: 0,
  globalIdx: 0,
  type: 'hd-wallet',
};

const ROUTER = dex.router.address as Encoded.ContractAddress;
const WAE = dex.wae.address as Encoded.ContractAddress;
const WTT = dex.token.address as Encoded.ContractAddress;
/** Mainnet's bridged USDC, for a token with 6 decimals */
const USDC = 'ct_293VYQPpamF74f413SbpVH8fxmkwV78Wtr8KTVsmT9XCNW813r' as Encoded.ContractAddress;
/** A token the middleware doesn't list: the code of WTT at another address */
const UNLISTED_TOKEN = MemoryAccount.generate().address.replace('ak_', 'ct_') as Encoded.ContractAddress;
const DEADLINE = 1700000000000n;

/** The tokens the middleware knows */
const AEX9_TOKENS: Record<string, object> = {
  [WTT]: {
    contract_id: WTT, name: 'WeTrue Token', symbol: 'WTT', decimals: 18,
  },
  [WAE]: {
    contract_id: WAE, name: 'Wrapped Aeternity', symbol: 'WAE', decimals: 18,
  },
  [USDC]: {
    contract_id: USDC, name: 'USDC', symbol: 'USDC', decimals: 6,
  },
};

const BYTECODES: Record<string, string> = {
  [ROUTER]: dex.router.bytecode,
  [WAE]: dex.wae.bytecode,
  [WTT]: dex.token.bytecode,
  [UNLISTED_TOKEN]: dex.token.bytecode,
};

vi.mock('@/composables/accounts', () => ({
  useAccounts: () => ({
    ...realAccounts.useAccounts(),
    accounts: ref([callerAccount]),
    activeAccount: ref(callerAccount),
    getLastActiveProtocolAccount: () => callerAccount,
    getAccountByProtocolAndAddress: (protocol: string, address: string) => (
      (protocol === callerAccount.protocol && address === CALLER) ? callerAccount : undefined
    ),
    setActiveAccountByAddressAndProtocol: () => {},
  }),
}));

vi.mock('@/composables/aeSdk', () => ({
  useAeSdk: () => ({
    ...realAeSdk.useAeSdk(),
    getAeSdk: async () => sdk,
  }),
}));

/** How the token sales service answers. It knows none of the contracts here. */
let answerTokenSales: () => Promise<Response>;

vi.stubGlobal('fetch', async (url: string) => {
  if (/\/tokens\/ct_\w+$/.test(url)) {
    return answerTokenSales();
  }
  const [, codeOf] = url.match(/^https:\/\/mainnet\.aeternity\.io\/v3\/contracts\/(ct_\w+)\/code$/) || [];
  if (BYTECODES[codeOf]) {
    return Response.json({ bytecode: BYTECODES[codeOf] });
  }
  const [, tokenOf] = url.match(/^https:\/\/mainnet\.aeternity\.io\/mdw\/v3\/aex9\/(ct_\w+)$/) || [];
  if (AEX9_TOKENS[tokenOf]) {
    return Response.json(AEX9_TOKENS[tokenOf]);
  }
  return new Response('', { status: 404 });
});

enableAutoUnmount(afterEach);

beforeAll(async () => {
  realAccounts.useAccounts = (
    await vi.importActual<typeof import('@/composables/accounts')>('@/composables/accounts')
  ).useAccounts;
  realAeSdk.useAeSdk = (
    await vi.importActual<typeof import('@/composables/aeSdk')>('@/composables/aeSdk')
  ).useAeSdk;
  realAeSdk.useAeSdk().nodeNetworkId.value = AE_NETWORK_MAINNET_ID;
});

beforeEach(() => {
  answerTokenSales = async () => new Response('', { status: 404 });
  sdk.getBalance.mockResolvedValue('1000000000000000000000');
  sdk.api.getAccountByPubkey.mockResolvedValue({ nonce: 1 });
  sdk.txDryRun.mockResolvedValue({ callObj: { returnType: 'ok', gasPrice: 1000000000n } });
});

const routerCalls = new AciContractCallEncoder(dex.router.aci);
const tokenCalls = new BytecodeContractCallEncoder(dex.token.bytecode);
const waeCalls = new BytecodeContractCallEncoder(dex.wae.bytecode);

function routerCall(fn: string, args: any[]) {
  return routerCalls.encodeCall('AedexV2Router', fn, args) as Encoded.ContractBytearray;
}

function contractCallTx(
  contractId: Encoded.ContractAddress,
  callData: Encoded.ContractBytearray,
  amount: bigint = 0n,
) {
  return buildTx({
    tag: Tag.ContractCallTx,
    callerId: CALLER,
    contractId,
    abiVersion: 3,
    nonce: 2,
    amount: amount.toString(),
    gasLimit: 100000,
    gasPrice: 1000000000,
    fee: 200000000000000,
    callData,
  });
}

const ae = (amount: number) => BigInt(Math.round(amount * 1e6)) * 10n ** 12n;

/** Opens the modal as the wallet does for an aepp's transaction, and waits until it is read. */
async function openModal(txBase64: Encoded.Transaction) {
  usePopupProps().setPopupProps({
    txBase64,
    tx: unpackTx(txBase64) as any,
    app: createAppData('https://dex.superhero.com/'),
    resolve: vi.fn(),
    reject: vi.fn(),
  } as any);
  const wrapper = mount(ConfirmTransactionSign, {
    global: {
      plugins: [i18n],
      stubs: {
        Modal: { template: '<div><slot /><slot name="footer" /></div>' },
        TransactionOverview: true,
        TransactionCallDataDetails: true,
        SignAccountSelect: true,
      },
    },
  });
  await vi.waitFor(() => {
    expect(wrapper.find('.loader').exists()).toBe(false);
    expect(wrapper.text()).toContain(tg('modals.confirmTransactionSign.functionName'));
    expect(wrapper.get('[data-cy=accept]').text()).toBe(tg('common.confirm'));
  }, { timeout: 5000 });
  return wrapper;
}

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

/** The same for every call here: 0.0003 AE in all */
const COST_LABELS = [
  tg('transaction.gasLimit'),
  tg('pages.transactionDetails.gasPrice'),
  tg('transaction.gasCost'),
  tg('transaction.fee'),
];

/**
 * The rows the user reads, leaving out the collapsed advanced details and the gas and fee.
 * An amount row reads as its amounts and symbols, without the fiat value, which is unknown here.
 */
function readRows(wrapper: VueWrapper) {
  return wrapper.findAll('.details-item:not(.advanced-transaction-details)')
    .map((row) => {
      const value = row.get('.value');
      const amounts = value.findAll('.token-amount .amount, .tokens .symbols');
      return [
        squash(row.get('.label').text()),
        amounts.length ? amounts.map((part) => squash(part.text())).join(' ') : squash(value.text()),
      ];
    })
    .filter(([label]) => !COST_LABELS.includes(label));
}

const functionRow = (name: string) => [tg('modals.confirmTransactionSign.functionName'), name];

/** The router's account, which an allowance names as the spender */
const ROUTER_ACCOUNT = ROUTER.replace('ct_', 'ak_');

describe('ConfirmTransactionSign, an aepp swapping on the DEX', () => {
  it('shows the coin spent and the least of the token received for it', async () => {
    const wrapper = await openModal(contractCallTx(
      ROUTER,
      routerCall('swap_exact_ae_for_tokens', [1500000000n, [WAE, USDC], CALLER, DEADLINE, undefined]),
      ae(2),
    ));

    expect(readRows(wrapper)).toEqual([
      functionRow('swap_exact_ae_for_tokens'),
      [tg('pages.signTransaction.from'), '2 AE'],
      [tg('pages.signTransaction.to'), 'USDC'],
      [tg('pages.signTransaction.minReceived'), '1,500 USDC'],
    ]);
  });

  it('shows the coin received and the most of a token spent for it', async () => {
    const wrapper = await openModal(contractCallTx(
      ROUTER,
      routerCall('swap_tokens_for_exact_ae', [ae(3), ae(250), [WTT, WAE], CALLER, DEADLINE, undefined]),
    ));

    expect(readRows(wrapper)).toEqual([
      functionRow('swap_tokens_for_exact_ae'),
      [tg('pages.signTransaction.from'), 'WTT'],
      [tg('pages.signTransaction.to'), '3 AE'],
      [tg('pages.signTransaction.maxSpent'), '250 WTT'],
    ]);
  });

  it('shows the least of the last token of a path received', async () => {
    const wrapper = await openModal(contractCallTx(
      ROUTER,
      routerCall('swap_exact_tokens_for_tokens', [ae(10), 2500000n, [WTT, WAE, USDC], CALLER, DEADLINE, undefined]),
    ));

    expect(readRows(wrapper)).toEqual([
      functionRow('swap_exact_tokens_for_tokens'),
      [tg('pages.signTransaction.from'), '10 WTT'],
      [tg('pages.signTransaction.to'), 'USDC'],
      [tg('pages.signTransaction.minReceived'), '2.50 USDC'],
    ]);
  });

  it('shows the coin sent as the most spent for a token', async () => {
    const wrapper = await openModal(contractCallTx(
      ROUTER,
      routerCall('swap_ae_for_exact_tokens', [ae(40), [WAE, WTT], CALLER, DEADLINE, undefined]),
      ae(1.25),
    ));

    expect(readRows(wrapper)).toEqual([
      functionRow('swap_ae_for_exact_tokens'),
      [tg('pages.signTransaction.from'), 'AE'],
      [tg('pages.signTransaction.to'), '40 WTT'],
      [tg('pages.signTransaction.maxSpent'), '1.25 AE'],
    ]);
  });
});

describe('ConfirmTransactionSign, an aepp changing DEX liquidity', () => {
  it('shows the most of the token and of the coin deposited', async () => {
    const wrapper = await openModal(contractCallTx(
      ROUTER,
      routerCall('add_liquidity_ae', [WTT, ae(100), ae(95), ae(1.9), CALLER, 1000n, DEADLINE]),
      ae(2),
    ));

    expect(readRows(wrapper)).toEqual([
      functionRow('add_liquidity_ae'),
      [tg('pages.signTransaction.maximumDeposited'), '100 WTT'],
      [tg('pages.signTransaction.maximumDeposited'), '2 AE'],
      [tg('common.total'), '2.0003 AE'],
    ]);
  });

  it('shows the most of each token deposited', async () => {
    const wrapper = await openModal(contractCallTx(
      ROUTER,
      routerCall('add_liquidity', [WTT, USDC, ae(100), 250000000n, ae(95), 240000000n, CALLER, undefined, DEADLINE]),
    ));

    expect(readRows(wrapper)).toEqual([
      functionRow('add_liquidity'),
      [tg('pages.signTransaction.maximumDeposited'), '100 WTT'],
      [tg('pages.signTransaction.maximumDeposited'), '250 USDC'],
      [tg('common.total'), '0.0003 AE'],
    ]);
  });

  it('shows the pool token spent and the least of the coin and of the token withdrawn', async () => {
    const wrapper = await openModal(contractCallTx(
      ROUTER,
      routerCall('remove_liquidity_ae', [WTT, ae(7), ae(60), ae(1.2), CALLER, DEADLINE]),
    ));

    expect(readRows(wrapper)).toEqual([
      functionRow('remove_liquidity_ae'),
      [tg('pages.signTransaction.poolTokenSpent'), '7 WTT / AE'],
      [tg('pages.signTransaction.minimumWithdrawn'), '1.20 AE'],
      [tg('pages.signTransaction.minimumWithdrawn'), '60 WTT'],
      [tg('common.total'), '0.0003 AE'],
    ]);
  });

  it('shows the pool token spent and the least of each token withdrawn', async () => {
    const wrapper = await openModal(contractCallTx(
      ROUTER,
      routerCall('remove_liquidity', [WTT, USDC, ae(7), ae(60), 150000000n, CALLER, DEADLINE]),
    ));

    expect(readRows(wrapper)).toEqual([
      functionRow('remove_liquidity'),
      [tg('pages.signTransaction.poolTokenSpent'), '7 WTT / USDC'],
      [tg('pages.signTransaction.minimumWithdrawn'), '150 USDC'],
      [tg('pages.signTransaction.minimumWithdrawn'), '60 WTT'],
      [tg('common.total'), '0.0003 AE'],
    ]);
  });
});

describe('ConfirmTransactionSign, an aepp sending or approving a token', () => {
  it('shows the amount of a token sent and who gets it', async () => {
    const recipient = MemoryAccount.generate().address;
    const wrapper = await openModal(contractCallTx(
      WTT,
      tokenCalls.encodeCall('transfer', [recipient, ae(500)]) as Encoded.ContractBytearray,
    ));

    expect(readRows(wrapper)).toEqual([
      functionRow('transfer'),
      [tg('common.amount'), '500 WTT'],
      [tg('pages.send.recipient'), recipient],
      [tg('common.total'), '0.0003 AE'],
    ]);
  });

  it('shows a token transfer while the token sales service does not answer', async () => {
    answerTokenSales = () => new Promise(() => {});
    const recipient = MemoryAccount.generate().address;
    const wrapper = await openModal(contractCallTx(
      WTT,
      tokenCalls.encodeCall('transfer', [recipient, ae(500)]) as Encoded.ContractBytearray,
    ));

    expect(readRows(wrapper)).toEqual([
      functionRow('transfer'),
      [tg('common.amount'), '500 WTT'],
      [tg('pages.send.recipient'), recipient],
      [tg('common.total'), '0.0003 AE'],
    ]);
  });

  it('shows no amount or recipient of a transfer of a token the middleware does not list', async () => {
    const wrapper = await openModal(contractCallTx(
      UNLISTED_TOKEN,
      tokenCalls.encodeCall('transfer', [MemoryAccount.generate().address, ae(500)]) as Encoded.ContractBytearray,
    ));

    expect(readRows(wrapper)).toEqual([
      functionRow('transfer'),
      [tg('common.total'), '0.0003 AE'],
    ]);
  });

  it('shows the amount of a token spent from an allowance and who gets it', async () => {
    const owner = MemoryAccount.generate().address;
    const recipient = MemoryAccount.generate().address;
    const wrapper = await openModal(contractCallTx(
      WTT,
      tokenCalls.encodeCall('transfer_allowance', [owner, recipient, ae(5)]) as Encoded.ContractBytearray,
    ));

    expect(readRows(wrapper)).toEqual([
      functionRow('transfer_allowance'),
      [tg('common.amount'), '5 WTT'],
      [tg('pages.send.recipient'), recipient],
      [tg('common.total'), '0.0003 AE'],
    ]);
  });

  it('shows by how much the allowance of a spender changes, and the spender', async () => {
    const wrapper = await openModal(contractCallTx(
      WTT,
      tokenCalls.encodeCall('change_allowance', [ROUTER_ACCOUNT, ae(500)]) as Encoded.ContractBytearray,
    ));

    expect(readRows(wrapper)).toEqual([
      functionRow('change_allowance'),
      [tg('pages.signTransaction.allowanceChange'), '500 WTT'],
      [tg('pages.signTransaction.spender'), ROUTER_ACCOUNT],
      [tg('common.total'), '0.0003 AE'],
    ]);
  });

  it('shows the amount of the wrapped coin the spender may use, and the spender', async () => {
    const wrapper = await openModal(contractCallTx(
      WAE,
      waeCalls.encodeCall('create_allowance', [ROUTER_ACCOUNT, ae(500)]) as Encoded.ContractBytearray,
    ));

    expect(readRows(wrapper)).toEqual([
      functionRow('create_allowance'),
      [tg('pages.signTransaction.approveUseOfToken'), '500 WAE'],
      [tg('pages.signTransaction.spender'), ROUTER_ACCOUNT],
      [tg('common.total'), '0.0003 AE'],
    ]);
  });
});

describe('ConfirmTransactionSign, an aepp wrapping the coin', () => {
  it('shows the coin turned into the wrapped coin, and the total in the coin', async () => {
    const wrapper = await openModal(contractCallTx(
      WAE,
      waeCalls.encodeCall('deposit', []) as Encoded.ContractBytearray,
      ae(3),
    ));

    expect(readRows(wrapper)).toEqual([
      functionRow('deposit'),
      [tg('pages.signTransaction.from'), '3 AE'],
      [tg('pages.signTransaction.to'), '3 WAE'],
      [tg('common.total'), '3.0003 AE'],
    ]);
  });

  it('shows the wrapped coin turned back into the coin', async () => {
    const wrapper = await openModal(contractCallTx(
      WAE,
      waeCalls.encodeCall('withdraw', [ae(4)]) as Encoded.ContractBytearray,
    ));

    expect(readRows(wrapper)).toEqual([
      functionRow('withdraw'),
      [tg('pages.signTransaction.from'), '4 WAE'],
      [tg('pages.signTransaction.to'), '4 AE'],
      [tg('common.total'), '0.0003 AE'],
    ]);
  });
});

describe('ConfirmTransactionSign, an aepp call checked before it is signed', () => {
  const swapWttForAe = () => contractCallTx(
    ROUTER,
    routerCall('swap_exact_tokens_for_ae', [ae(10), ae(2), [WTT, WAE], CALLER, DEADLINE, undefined]),
  );
  const isConfirmBlocked = (wrapper: VueWrapper) => (
    wrapper.get('[data-cy=accept]').attributes('aria-disabled') === 'true'
  );

  it('warns of a balance short of the cost, and leaves paying it to the aepp', async () => {
    sdk.getBalance.mockResolvedValue('0');
    const wrapper = await openModal(swapWttForAe());

    expect(wrapper.findAll('[data-cy=ae-balance-warning] p').map((p) => squash(p.text()))).toEqual([
      tg('modals.confirmTransactionSign.notEnoughAE'),
      tg('modals.confirmTransactionSign.paidByDapp'),
    ]);
    expect(isConfirmBlocked(wrapper)).toBe(false);
  });

  it('blocks a swap the node would revert, and shows why', async () => {
    const reason = 'AedexV2Router: INSUFFICIENT_OUTPUT_AMOUNT';
    sdk.txDryRun.mockResolvedValue({
      callObj: {
        returnType: 'revert',
        returnValue: new ContractByteArrayEncoder()
          .encodeWithType(reason, new TypeResolver().resolveType('string')),
      },
    });
    const wrapper = await openModal(swapWttForAe());

    expect(wrapper.text()).toContain(tg('modals.confirmTransactionSign.unableToExecute'));
    expect(readRows(wrapper)).toContainEqual([tg('pages.transactionDetails.reason'), reason]);
    expect(isConfirmBlocked(wrapper)).toBe(true);
  });

  it('lets the user confirm a swap the node would run', async () => {
    const wrapper = await openModal(swapWttForAe());

    expect(wrapper.find('[data-cy=reason]').exists()).toBe(false);
    expect(isConfirmBlocked(wrapper)).toBe(false);
  });
});
