import { computed } from 'vue';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { Tag } from '@aeternity/aepp-sdk';

import ConfirmTransactionSign from '@/popup/components/Modals/ConfirmTransactionSign.vue';
import {
  useAccounts,
  useAeSdk,
  useFungibleTokens,
  useModals,
  usePopupProps,
  useTransactionData,
} from '@/composables';
import { PROTOCOLS } from '@/constants';
import en from '@/popup/locales/en-US.json';

const ADDRESS = '0x1111111111111111111111111111111111111111';
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const pad = (hex: string) => hex.replace(/^0x/, '').toLowerCase().padStart(64, '0');
const TRANSFER_DATA = `0xa9059cbb${pad('0x000000000000000000000000000000000000dEaD')}${pad((1_000_000_000).toString(16))}`;

vi.mock('@/composables', async () => ({
  useAccounts: vi.fn(),
  useAeSdk: vi.fn(),
  useFungibleTokens: vi.fn(),
  useModals: vi.fn(),
  usePopupProps: (await vi.importActual<any>('@/composables/popupProps')).usePopupProps,
  useTransactionData: vi.fn(),
}));

vi.mock('@/protocols/aeternity/composables/aeTokenSales', () => ({
  useAeTokenSales: vi.fn(() => ({
    loadTokenSalesInfoByContractId: vi.fn(),
    tokenSaleAddressToTokenContractAddress: vi.fn(),
  })),
}));

enableAutoUnmount(afterEach);

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

const TokenAmountStub = {
  name: 'TokenAmount',
  props: ['amount', 'symbol', 'protocol', 'hideFiat'],
  template: '<span class="token-amount-stub">{{ amount }} {{ symbol }}</span>',
};

const EvmCallSimulationStub = {
  name: 'EvmCallSimulation',
  props: ['protocol', 'evmCall'],
  template: '<div class="evm-call-simulation-stub" />',
};

const EvmCallSummaryStub = {
  name: 'EvmCallSummary',
  props: ['protocol', 'evmCall'],
  template: '<div class="evm-call-summary-stub" />',
};

const BtnMainStub = {
  name: 'BtnMain',
  props: ['disabled', 'text'],
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>',
};

let resolve: ReturnType<typeof vi.fn>;

/** Mounts the confirmation of an EVM dapp request; `amountTotal` is what the shared logic gives */
function mountModal(
  tx: Record<string, any>,
  amountTotal: number,
  popupPropsOverrides: Record<string, any> = {},
) {
  resolve = vi.fn();
  usePopupProps().setPopupProps({
    protocol: PROTOCOLS.ethereum,
    tx: {
      senderId: ADDRESS,
      ...tx,
    },
    app: {
      host: 'dapp.test', name: 'dapp.test', protocol: 'https:', href: 'https://dapp.test/',
    },
    fromAccount: ADDRESS,
    resolve,
    reject: vi.fn(),
    ...popupPropsOverrides,
  } as any);

  const account = {
    protocol: PROTOCOLS.ethereum, address: ADDRESS, idx: 0, globalIdx: 0, type: 'hd-wallet',
  };
  (useAccounts as any).mockReturnValue({
    getLastActiveProtocolAccount: vi.fn(() => account),
    getAccountByProtocolAndAddress: vi.fn(() => account),
    setActiveAccountByAddressAndProtocol: vi.fn(),
  });
  (useAeSdk as any).mockReturnValue({ getAeSdk: vi.fn() });
  (useFungibleTokens as any).mockReturnValue({
    loadSingleToken: vi.fn(),
    getProtocolAvailableTokens: vi.fn(() => ({})),
    getTxAssetSymbol: vi.fn(() => 'USDC'),
  });
  (useModals as any).mockReturnValue({ openModal: vi.fn() });
  (useTransactionData as any).mockReturnValue({
    amountTotal: computed(() => amountTotal),
    direction: computed(() => 'sent'),
    innerTx: computed(() => undefined),
    isAex9: computed(() => false),
    isDex: computed(() => false),
    isAllowance: computed(() => false),
    isDexLiquidityAdd: computed(() => false),
    isDexLiquidityRemove: computed(() => false),
    isDexMaxSpent: computed(() => false),
    isDexMinReceived: computed(() => false),
    isDexPool: computed(() => false),
    isDexSwap: computed(() => false),
    isTokenSale: computed(() => false),
    isTokenSaleFactory: computed(() => false),
    txFunctionParsed: computed(() => undefined),
    transactionAssets: computed(() => []),
    outerTxTag: computed(() => undefined),
  });

  return mount(ConfirmTransactionSign, {
    global: {
      plugins: [i18n],
      stubs: {
        Modal: { template: '<div><slot /><slot name="footer" /></div>' },
        TransactionOverview: true,
        TransactionDetailsPoolTokenRow: true,
        TransactionCallDataDetails: true,
        NoOriginWarning: true,
        SignAccountSelect: true,
        TokenAmount: TokenAmountStub,
        BtnMain: BtnMainStub,
        EvmCallSummary: EvmCallSummaryStub,
        EvmCallSimulation: EvmCallSimulationStub,
      },
    },
  });
}

const getTotal = (wrapper: any) => wrapper
  .findAllComponents(TokenAmountStub)
  .find((amount: any) => amount.attributes('data-cy') === 'total');

describe('ConfirmTransactionSign total of an EVM dapp request', () => {
  /** What the shared logic gives, which the total of an EVM request doesn't take */
  const SHARED_TOTAL = 999;

  it('is the fee in the coin for a call to a token contract', async () => {
    // The shared logic reads the ETH value of a call to a known token as its token amount
    const wrapper = mountModal({
      tag: Tag.ContractCallTx,
      amount: 0,
      fee: 0.00002,
      contractId: USDC,
      recipientId: USDC,
      data: TRANSFER_DATA,
    }, SHARED_TOTAL);
    await flushPromises();

    expect(getTotal(wrapper).props()).toMatchObject({ amount: 0.00002, symbol: 'ETH' });
  });

  it('adds the value sent with a contract call', async () => {
    const wrapper = mountModal({
      tag: Tag.ContractCallTx,
      amount: 0.5,
      fee: 0.00002,
      contractId: USDC,
      recipientId: USDC,
      data: TRANSFER_DATA,
    }, SHARED_TOTAL);
    await flushPromises();

    expect(getTotal(wrapper).props()).toMatchObject({ amount: 0.50002, symbol: 'ETH' });
  });

  it('is the amount and the fee for a coin transfer', async () => {
    const wrapper = mountModal({
      tag: Tag.SpendTx,
      amount: 0.01,
      fee: 0.000003729,
      contractId: 'ethereum',
      recipientId: '0x000000000000000000000000000000000000dEaD',
    }, SHARED_TOTAL);
    await flushPromises();

    expect(getTotal(wrapper).props('amount')).toBe(0.010003729);
  });
});

describe('ConfirmTransactionSign summary of an EVM dapp request', () => {
  const evmCall = {
    from: ADDRESS, to: USDC, value: '0x0', data: TRANSFER_DATA, gas: '0x186a0', chainId: '1',
  };
  const callTx = {
    tag: Tag.ContractCallTx,
    amount: 0,
    fee: 0.00002,
    contractId: USDC,
    recipientId: USDC,
    data: TRANSFER_DATA,
  };

  it('shows what the call does, and leaves confirming to the user', async () => {
    const wrapper = mountModal(callTx, 0, { evmCall });
    await flushPromises();

    expect(wrapper.findComponent(EvmCallSummaryStub).props())
      .toEqual({ protocol: PROTOCOLS.ethereum, evmCall });
    expect(wrapper.findComponent(EvmCallSimulationStub).props())
      .toEqual({ protocol: PROTOCOLS.ethereum, evmCall });
    const accept = wrapper.find('[data-cy=accept]');
    expect(accept.attributes('disabled')).toBeUndefined();
    await accept.trigger('click');
    expect(resolve).toHaveBeenCalledWith(expect.objectContaining({ selectedAddress: ADDRESS }));
  });

  it('shows no summary without the call, as for a value that is no quantity', async () => {
    const wrapper = mountModal(callTx, 0);
    await flushPromises();

    expect(wrapper.findComponent(EvmCallSummaryStub).exists()).toBe(false);
    expect(wrapper.findComponent(EvmCallSimulationStub).exists()).toBe(false);
  });

  it.each([['0x'], ['']])('previews no balances of a coin transfer, data %j', async (data) => {
    const wrapper = mountModal({
      tag: Tag.SpendTx,
      amount: 0.01,
      fee: 0.000003729,
      contractId: 'ethereum',
      recipientId: USDC,
    }, 0.010003729, { evmCall: { ...evmCall, value: '0x2386f26fc10000', data } });
    await flushPromises();

    expect(wrapper.findComponent(EvmCallSimulationStub).exists()).toBe(false);
  });
});
