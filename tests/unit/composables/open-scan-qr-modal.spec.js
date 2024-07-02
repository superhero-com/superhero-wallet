import { useTransferSendForm } from '@/composables/transferSendForm';
import { STUB_ACCOUNT, STUB_CONTRACT_ADDRESS, STUB_TOKEN_CONTRACT_ADDRESS } from '@/constants/stubs';

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

jest.mock('vue-i18n', () => ({
  useI18n: jest.fn(() => ({
    t: () => 'locale-specific-text',
  })),
}));

jest.mock('@/composables/transferSendHandler', () => ({
  useTransferSendHandler: jest.fn(() => ({
    save: () => {},
  })),
}));

jest.mock('@/composables/accountAssetsList', () => ({
  useAccountAssetsList: jest.fn(() => ({
    accountAssets: { value: [{ contractId: 'ct_T6MWNrowGVC9dyTDksCBrCCSaeK3hzBMMY5hhMKwvwr8wJvM8' }] }, // STUB_TOKEN_CONTRACT_ADDRESS
  })),
}));

jest.mock('@/composables/modals', () => ({
  useModals: jest.fn(() => ({
    openScanQrModal: qrCodeSource,
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
  } = useTransferSendForm({ transferData, getSelectedAssetValue });

  it('parses address qr code', async () => {
    await scanTransferQrCode();
    expect(formModel.value.address).toBe(STUB_ACCOUNT.addressAeternity);
  });

  it('parses ae amount qr code', async () => {
    numberOfTheTest = 1;
    await scanTransferQrCode();
    expect(formModel.value.address).toBe(STUB_ACCOUNT.addressAeternity);
    expect(formModel.value.amount).toBe(testAmount);
  });

  it('parses contract amount qr code', async () => {
    numberOfTheTest = 2;
    await scanTransferQrCode();
    expect(formModel.value.address).toBe(STUB_ACCOUNT.addressAeternity);
    expect(formModel.value.amount).toBe(testAmount);
    expect(formModel.value.selectedAsset).toBe(STUB_TOKEN_CONTRACT_ADDRESS);
  });

  it('parses contract amount legacy qr code', async () => {
    numberOfTheTest = 3;
    await scanTransferQrCode();
    expect(formModel.value.address).toBe(STUB_ACCOUNT.addressAeternity);
    expect(formModel.value.amount).toBe(testAmount);
    expect(formModel.value.selectedAsset).toBe(STUB_TOKEN_CONTRACT_ADDRESS);
  });

  it('parses zeit contract qr code', async () => {
    numberOfTheTest = 4;
    await scanTransferQrCode();
    expect(formModel.value.address).toBe(STUB_TOKEN_CONTRACT_ADDRESS);
    expect(formModel.value.amount).toBe(testAmount);
    expect(formModel.value.selectedAsset.contractId).toBe(STUB_TOKEN_CONTRACT_ADDRESS);
    expect(invoiceId.value).toBe(testInvoiceId);
    expect(invoiceContract.value).toBe(STUB_CONTRACT_ADDRESS);
  });

  it('handles user scan reject with existing data', async () => {
    numberOfTheTest = 5;
    await scanTransferQrCode();
    expect(formModel.value.address).toBe(STUB_TOKEN_CONTRACT_ADDRESS);
    expect(formModel.value.amount).toBe(testAmount);
    expect(formModel.value.selectedAsset.contractId).toBe(STUB_TOKEN_CONTRACT_ADDRESS);
  });
});
