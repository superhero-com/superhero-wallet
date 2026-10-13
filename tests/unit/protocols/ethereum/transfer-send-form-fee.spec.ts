/**
 * [BLACK-BOX] The ETH send form hands the review screen the gas prices it signs every
 * recipient's transaction with, and the fee of all those transactions together.
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';

import '@/protocols/registerAdapters';
import TransferSendForm from '@/protocols/ethereum/components/TransferSendForm.vue';
import { PROTOCOLS } from '@/constants';
import { i18n } from '@/popup/plugins/i18n';

// The setup files already loaded the fee composable with the real deps; reload it to apply mocks.
const { GAS_LIMITS } = vi.hoisted(() => {
  vi.resetModules();
  return {
    // A transfer to a fresh token holder costs more gas.
    GAS_LIMITS: {
      '0x0000000000000000000000000000000000000004': 50000,
      '0x0000000000000000000000000000000000000005': 30000,
      '0x0000000000000000000000000000000000000006': 30000,
    } as Record<string, number>,
  };
});

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
    };
  };
  return { ...await importOriginal<object>(), Web3Eth, default: Web3Eth };
});

// Stands in for the node's `estimateGas` of each recipient's token transfer.
vi.mock('@/protocols/ethereum/helpers', async (importOriginal) => ({
  ...await importOriginal<object>(),
  getTokenTransferGasLimit: async (contractId: string, recipient: string) => GAS_LIMITS[recipient],
}));

// The route, QR code and validation handling play no part in the fee.
vi.mock('@/composables/transferSendForm', async () => {
  const { computed, ref } = await import('vue');
  return {
    useTransferSendForm: ({ transferData }: any) => ({
      formModel: ref(transferData),
      errors: ref({}),
      hasError: computed(() => false),
      invoiceId: ref(null),
      invoiceContract: ref(null),
      scanTransferQrCode: () => {},
      handleAssetChange: () => {},
    }),
  };
});

enableAutoUnmount(afterEach);

describe('EthTransferSendForm - multiple recipients', () => {
  it('signs each token transfer with single-recipient gas prices and the largest gas limit', async () => {
    const wrapper = mount(TransferSendForm, {
      props: {
        protocol: PROTOCOLS.ethereum,
        transferData: {
          addresses: Object.keys(GAS_LIMITS),
          amount: '1',
          selectedAsset: {
            contractId: '0x0000000000000000000000000000000000000003',
            protocol: PROTOCOLS.ethereum,
            decimals: 18,
            amount: '10',
          },
        },
      },
      global: {
        plugins: [i18n],
        stubs: { TransferSendFormBase: true },
      },
    });
    await flushPromises();
    await (wrapper.vm as any).submit();

    const [transferData] = wrapper.emitted<any[]>('update:transferData')!.at(-1)!;
    // Slow speed: node max fee 2 gwei + priority fee 1 gwei, for each transaction alike
    expect(transferData.maxFeePerGas).toBe('0.000000003000000000');
    expect(transferData.maxPriorityFeePerGas).toBe('0.000000001000000000');
    // (base fee 1 gwei + priority fee 1 gwei) * 50 000 gas * 3 recipients
    expect(transferData.fee.toFixed()).toBe('0.0003');
  });
});
