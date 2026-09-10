import { createApp, ref } from 'vue';
import { useTransferSendForm } from '@/composables/transferSendForm';
import { STUB_ACCOUNT, STUB_CONTRACT_ADDRESS, STUB_TOKEN_CONTRACT_ADDRESS } from '@/constants/stubs';

/**
 * `useTransferSendForm` registers an `onMounted` hook (route-query watches) at its top
 * level, so it needs a real component instance to attach to - calling it bare would warn
 * "onMounted is called when there is no active component instance". Mounting a throwaway
 * host component gives it one without pulling in the real router/DOM tree.
 */
function withSetup(composable) {
  let result;
  const app = createApp({
    setup() {
      result = composable();
      return () => {};
    },
  });
  app.mount(document.createElement('div'));
  return result;
}

const testAmount = '11.111';
const testInvoiceId = '232323123';
let numberOfTheTest = 0;

const qrCodeSource = async () => {
  switch (numberOfTheTest) {
    case (0): return Promise.resolve(STUB_ACCOUNT.addressAeternity);
    case (1): return Promise.resolve(`https://wallet.superhero.com/account?op=transferSend&token=AE&amount=${testAmount}&account=${STUB_ACCOUNT.addressAeternity}`);
    case (2): return Promise.resolve(`https://wallet.superhero.com/account?op=transferSend&token=${STUB_TOKEN_CONTRACT_ADDRESS}&amount=${testAmount}&account=${STUB_ACCOUNT.addressAeternity}`);
    case (3): return Promise.resolve(`${STUB_ACCOUNT.addressAeternity}?token=${STUB_TOKEN_CONTRACT_ADDRESS}&amount=${testAmount}`);
    case (4): return Promise.resolve(`{ "invoiceId": "${testInvoiceId}", "invoiceContract": "${STUB_CONTRACT_ADDRESS}", "tokenContract": "${STUB_TOKEN_CONTRACT_ADDRESS}", "amount": "${testAmount}" }`);
    case (5): return Promise.resolve(null);
    default:
      return '';
  }
};

vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: () => 'locale-specific-text',
  })),
}));

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ query: {} })),
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
}));

vi.mock('vee-validate', () => ({
  useForm: vi.fn(() => ({
    errors: { value: {} },
    validate: vi.fn(),
    validateField: vi.fn(),
  })),
}));

vi.mock('@/composables/transferSendHandler', () => ({
  useTransferSendHandler: vi.fn(() => ({
    save: () => {},
  })),
}));

vi.mock('@/composables/accountAssetsList', () => ({
  useAccountAssetsList: vi.fn(() => ({
    accountAssets: { value: [{ contractId: 'ct_T6MWNrowGVC9dyTDksCBrCCSaeK3hzBMMY5hhMKwvwr8wJvM8' }] }, // STUB_TOKEN_CONTRACT_ADDRESS
  })),
}));

vi.mock('@/composables', () => ({
  useModals: vi.fn(() => ({
    openScanQrModal: qrCodeSource,
  })),
  useAccounts: vi.fn(() => ({
    accounts: [],
    // Must be a real ref - `transferSendForm`'s onMounted watch uses it as a watch
    // source, and Vue only accepts refs/reactive objects/getters there.
    activeAccount: ref({}),
  })),
}));

function getSelectedAssetValue(contractId) {
  return contractId;
}

const transferData = {
  address: '',
  amount: '',
  payload: '',
  selectedAsset: undefined,
};

describe('scanTransferQrCode', () => {
  const {
    formModel,
    invoiceId,
    invoiceContract,
    scanTransferQrCode,
  } = withSetup(() => useTransferSendForm({ transferData, getSelectedAssetValue }));

  it('parses address qr code', async () => {
    await scanTransferQrCode();
    expect(formModel.value.addresses[0]).toBe(STUB_ACCOUNT.addressAeternity);
  });

  it('parses ae amount qr code', async () => {
    numberOfTheTest = 1;
    await scanTransferQrCode();
    expect(formModel.value.addresses[0]).toBe(STUB_ACCOUNT.addressAeternity);
    expect(formModel.value.amount).toBe(testAmount);
  });

  it('parses contract amount qr code', async () => {
    numberOfTheTest = 2;
    await scanTransferQrCode();
    expect(formModel.value.addresses[0]).toBe(STUB_ACCOUNT.addressAeternity);
    expect(formModel.value.amount).toBe(testAmount);
    expect(formModel.value.selectedAsset).toBe(STUB_TOKEN_CONTRACT_ADDRESS);
  });

  it('parses contract amount legacy qr code', async () => {
    numberOfTheTest = 3;
    await scanTransferQrCode();
    expect(formModel.value.addresses[0]).toBe(STUB_ACCOUNT.addressAeternity);
    expect(formModel.value.amount).toBe(testAmount);
    expect(formModel.value.selectedAsset).toBe(STUB_TOKEN_CONTRACT_ADDRESS);
  });

  it('parses zeit contract qr code', async () => {
    numberOfTheTest = 4;
    await scanTransferQrCode();
    expect(formModel.value.addresses[0]).toBe(STUB_TOKEN_CONTRACT_ADDRESS);
    expect(formModel.value.amount).toBe(testAmount);
    expect(formModel.value.selectedAsset.contractId).toBe(STUB_TOKEN_CONTRACT_ADDRESS);
    expect(invoiceId.value).toBe(testInvoiceId);
    expect(invoiceContract.value).toBe(STUB_CONTRACT_ADDRESS);
  });

  it('handles user scan reject with existing data', async () => {
    numberOfTheTest = 5;
    await scanTransferQrCode();
    expect(formModel.value.addresses[0]).toBe(STUB_TOKEN_CONTRACT_ADDRESS);
    expect(formModel.value.amount).toBe(testAmount);
    expect(formModel.value.selectedAsset.contractId).toBe(STUB_TOKEN_CONTRACT_ADDRESS);
  });
});
