/**
 * [BLACK-BOX] Max on the EVM send form fills the token balance the node reports, as the
 * token API lags behind recent sends. Runs the app's real form and validation rules.
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import BigNumber from 'bignumber.js';

import '@/protocols/registerAdapters';
import TransferSendForm from '@/protocols/ethereum/components/TransferSendForm.vue';
import TransferSendAmount from '@/popup/components/TransferSend/TransferSendAmount.vue';
import { PROTOCOLS } from '@/constants';
import { useNetworks } from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { i18n, tg } from '@/popup/plugins/i18n';
import initVeeValidateRules from '@/popup/plugins/veeValidate';
import { useEthTokenBalance } from '@/protocols/ethereum/composables/ethTokenBalance';

// The setup files already loaded the form's deps with the real ones; reload them to apply mocks.
const { realAccounts, getTokenBalance } = vi.hoisted(() => {
  vi.resetModules();
  return {
    realAccounts: { useAccounts: () => ({}) },
    getTokenBalance: vi.fn(),
  };
});

const OWNER = '0x0000000000000000000000000000000000000001';
const TOKEN = '0x0000000000000000000000000000000000000003';
const OTHER_TOKEN = '0x0000000000000000000000000000000000000004';
const RECIPIENT = '0x0000000000000000000000000000000000000005';
const UNMINED_TOKEN = '0x0000000000000000000000000000000000000006';
const OTHER_RECIPIENT = '0x0000000000000000000000000000000000000007';

vi.mock('web3-eth', async (importOriginal) => {
  // vitest constructs this directly (`new Web3Eth(...)`), which throws on an arrow fn.
  // eslint-disable-next-line prefer-arrow-callback
  const Web3Eth = function Web3Eth() {
    return {
      calculateFeeData: async () => ({
        baseFeePerGas: '1000000000',
        maxFeePerGas: '2000000000',
        maxPriorityFeePerGas: '1000000000',
      }),
      // Of the chains without EIP-1559
      getGasPrice: async () => 1000000000n,
      getBlockNumber: async () => 100n,
      // The account's send with nonce 5 is in the mempool
      getTransactionCount: async (address: string, block: bigint | 'pending') => (
        block === 'pending' ? 6n : 5n
      ),
    };
  };
  return { ...await importOriginal<object>(), Web3Eth, default: Web3Eth };
});

vi.mock('@/protocols/ethereum/helpers', async (importOriginal) => ({
  ...await importOriginal<object>(),
  getTokenTransferGasLimit: async () => 50000,
  getTokenBalance,
}));

// Enough ETH for the fee, so the amount is checked against Max
vi.mock('@/composables/balances', async () => {
  const { ref } = await import('vue');
  const { default: BigNumberActual } = await import('bignumber.js');
  return {
    useBalances: () => ({ balance: ref(new BigNumberActual(1)), updateBalances: async () => {} }),
  };
});

// The real store is loaded in `beforeAll`: loading it in the factory would bind the barrel to it.
vi.mock('@/composables/accounts', async () => {
  const { ref } = await import('vue');
  return {
    useAccounts: () => ({
      ...realAccounts.useAccounts(),
      activeAccount: ref({ protocol: PROTOCOLS.ethereum, address: OWNER }),
    }),
  };
});

// Offline: the token API requests never settle
vi.stubGlobal('fetch', () => new Promise(() => {}));

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { render: () => null } }],
});

enableAutoUnmount(afterEach);

beforeAll(async () => {
  realAccounts.useAccounts = (
    await vi.importActual<typeof import('@/composables/accounts')>('@/composables/accounts')
  ).useAccounts;
  initVeeValidateRules();
});

beforeEach(() => {
  getTokenBalance.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

/** A 6-decimal token the token API says holds 50 */
function token(contractId = TOKEN, protocol: string = PROTOCOLS.ethereum) {
  return {
    contractId,
    protocol,
    name: 'Test USD',
    symbol: 'TUSD',
    decimals: 6,
    amount: '50000000',
  };
}

function mountForm(
  selectedAsset: object,
  { protocol = PROTOCOLS.ethereum, addresses = [RECIPIENT] }: {
    protocol?: string;
    addresses?: string[];
  } = {},
) {
  return mount(TransferSendForm, {
    props: {
      protocol,
      transferData: {
        addresses,
        amount: '',
        selectedAsset,
      },
    },
    global: {
      plugins: [i18n, router],
      stubs: { AccountItem: { render: () => null }, TransferSendRecipient: true },
    },
  });
}

function getAmountInput(wrapper: ReturnType<typeof mountForm>) {
  return wrapper.find<HTMLInputElement>('[data-cy=amount] [data-cy=input]');
}

async function clickMax(wrapper: ReturnType<typeof mountForm>) {
  await wrapper.find('[data-cy=amount] .max-button').trigger('click');
  await flushPromises();
  return getAmountInput(wrapper).element.value;
}

function selectAsset(wrapper: ReturnType<typeof mountForm>, asset: object) {
  wrapper.findComponent(TransferSendAmount).vm.$emit('asset-selected', asset);
}

describe('EthTransferSendForm - max token amount', () => {
  it.each([
    PROTOCOLS.ethereum,
    PROTOCOLS.bnb,
    PROTOCOLS.avalanche,
    PROTOCOLS.polygonPos,
  ])('fills the balance the %s node reports', async (protocol) => {
    const { nodeUrl } = useNetworks().activeNetwork.value.protocols[protocol];
    getTokenBalance.mockImplementation(async (...args: string[]) => new BigNumber(
      args.join() === [TOKEN, OWNER, nodeUrl].join() ? '42.5' : '0',
    ));
    const wrapper = mountForm(token(TOKEN, protocol), { protocol });
    await flushPromises();

    expect(await clickMax(wrapper)).toBe('42.5');
  });

  it('fills nothing once the node shows the whole balance sent', async () => {
    getTokenBalance.mockResolvedValue(new BigNumber(0));
    const wrapper = mountForm(token());
    await flushPromises();

    expect(await clickMax(wrapper)).toBe('0');
  });

  it('splits the balance the node reports across recipients', async () => {
    getTokenBalance.mockResolvedValue(new BigNumber('42.5'));
    const wrapper = mountForm(token(), { addresses: [RECIPIENT, OTHER_RECIPIENT] });
    await flushPromises();

    expect(await clickMax(wrapper)).toBe('21.25');
  });

  it('follows the balance the node reports while Max is on', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    let nodeBalance = '42.5';
    getTokenBalance.mockImplementation(async () => new BigNumber(nodeBalance));
    const wrapper = mountForm(token());
    await flushPromises();
    expect(await clickMax(wrapper)).toBe('42.5');

    // E.g. a send from another wallet got mined
    nodeBalance = '30';
    await vi.advanceTimersByTimeAsync(5000);
    await flushPromises();

    expect(getAmountInput(wrapper).element.value).toBe('30');
  });

  it('leaves an unmined send of the token out', async () => {
    const { nodeUrl } = useNetworks().activeNetwork.value.protocols[PROTOCOLS.ethereum];
    useEthTokenBalance().addUnconfirmedTokenTransfer({
      nodeUrl,
      from: OWNER,
      contractId: UNMINED_TOKEN,
      nonce: 5,
      amount: '10',
    });
    getTokenBalance.mockResolvedValue(new BigNumber('42.5'));
    const wrapper = mountForm(token(UNMINED_TOKEN));
    await flushPromises();

    expect(await clickMax(wrapper)).toBe('32.5');
  });

  it('does not accept more than the balance the node reports', async () => {
    getTokenBalance.mockResolvedValue(new BigNumber('42.5'));
    const wrapper = mountForm(token());
    await flushPromises();
    await getAmountInput(wrapper).setValue('45');
    await flushPromises();

    expect(wrapper.find('[data-cy=amount] [data-cy=input-field-message]').text())
      .toBe(tg('validation.maxValue', ['42.5']));
  });

  it('fills the token API balance if the node fails', async () => {
    getTokenBalance.mockRejectedValue(new Error('Network error'));
    const wrapper = mountForm(token());
    await flushPromises();

    expect(await clickMax(wrapper)).toBe('50');
  });

  it('does not take the balance of a token switched away from', async () => {
    let resolveFirst: (balance: BigNumber) => void;
    getTokenBalance
      .mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValue(new BigNumber('7'));
    const wrapper = mountForm(token());
    selectAsset(wrapper, token(OTHER_TOKEN));
    await flushPromises();
    resolveFirst!(new BigNumber('42.5'));
    await flushPromises();

    expect(await clickMax(wrapper)).toBe('7');
  });

  it('fills the token API balance of a token switched to if the node fails', async () => {
    getTokenBalance
      .mockResolvedValueOnce(new BigNumber('42.5'))
      .mockRejectedValue(new Error('Network error'));
    const wrapper = mountForm(token());
    await flushPromises();
    selectAsset(wrapper, token(OTHER_TOKEN));
    await flushPromises();

    expect(await clickMax(wrapper)).toBe('50');
  });

  it('does not read a token balance for the coin', async () => {
    mountForm(ProtocolAdapterFactory.getAdapter(PROTOCOLS.ethereum).getDefaultCoin());
    await flushPromises();

    expect(getTokenBalance).not.toHaveBeenCalled();
  });
});
