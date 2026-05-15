import { mount } from '@vue/test-utils';

const mockPostJson = jest.fn();
const mockHandleUnknownError = jest.fn();
const mockOpenConfirmModal = jest.fn();
const mockUpdateNamePointer = jest.fn();
const mockUpdateOwnedNames = jest.fn();
const mockFetchRespondChallenge = jest.fn();
const mockSetDefaultName = jest.fn();
const { computed: mockComputed, ref: mockRef } = jest.requireActual('vue');
let NameItem;

jest.mock('@aeternity/aepp-sdk', () => ({
  Encoding: {
    AccountAddress: 'ak',
  },
  isAddressValid: jest.fn(() => true),
}));

jest.mock('vue-i18n', () => ({
  useI18n: jest.fn(() => ({
    t: (key, params) => (params ? `${key}${JSON.stringify(params)}` : key),
  })),
}));

jest.mock('@/utils', () => ({
  blocksToRelativeTime: jest.fn(() => '1 day'),
  handleUnknownError: mockHandleUnknownError,
  postJson: mockPostJson,
}));

jest.mock('@/composables', () => ({
  useAccounts: jest.fn(() => ({
    activeAccount: mockRef({ address: 'ak_test' }),
  })),
  useAeSdk: jest.fn(() => ({
    nodeNetworkId: mockRef('ae_testnet'),
    fetchRespondChallenge: mockFetchRespondChallenge,
  })),
  useModals: jest.fn(() => ({
    openConfirmModal: mockOpenConfirmModal,
    openModal: jest.fn(),
  })),
  useTopHeaderData: jest.fn(() => ({
    topBlockHeight: mockRef(100),
  })),
}));

jest.mock('@/protocols/aeternity/composables/aeNames', () => ({
  NAME_CLAIM_STATUS: {
    preclaimed: 'preclaimed',
    claimSubmitted: 'claim-submitted',
    pointerUpdatePending: 'pointer-update-pending',
    transferring: 'transferring',
  },
  useAeNames: jest.fn(() => ({
    setAutoExtend: jest.fn(),
    updateNamePointer: mockUpdateNamePointer,
    getName: jest.fn(() => mockComputed(() => 'default.chain')),
    getNameExtendFee: jest.fn(() => 0.001),
    extendExpiringOwnedNames: jest.fn(),
    ownedNames: mockRef([{
      name: 'default.chain',
      owner: 'ak_test',
      pending: false,
      pointers: { accountPubkey: 'ak_test' },
    }]),
    updateOwnedNames: mockUpdateOwnedNames,
    setDefaultName: mockSetDefaultName,
  })),
}));

jest.mock('@/protocols/aeternity/composables', () => ({
  useAeNetworkSettings: jest.fn(() => ({
    aeActiveNetworkSettings: mockRef({ backendUrl: 'https://backend.test' }),
  })),
}));

jest.mock('@/protocols/aeternity/helpers', () => ({
  checkAddressOrChannel: jest.fn(() => true),
}));

jest.mock('@/protocols/aeternity/config', () => ({
  UPDATE_POINTER_ACTION: {
    update: 'update',
    extend: 'extend',
    transfer: 'transfer',
  },
}));

describe('NameItem', () => {
  beforeAll(async () => {
    ({ default: NameItem } = await import('@/popup/components/NameItem.vue'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenConfirmModal.mockResolvedValue(undefined);
    mockUpdateNamePointer.mockResolvedValue(true);
    mockUpdateOwnedNames.mockResolvedValue(undefined);
    mockFetchRespondChallenge.mockResolvedValue({ signed: true });
    mockPostJson.mockResolvedValue({ challenge: true });
  });

  it('clears the backend default name when transferring the default without a fallback', async () => {
    const wrapper = mount(NameItem, {
      props: {
        nameEntry: {
          name: 'default.chain',
          owner: 'ak_test',
          pending: false,
          pointers: { accountPubkey: 'ak_test' },
          createdAtHeight: 1,
          expiresAt: 150,
          autoExtend: false,
          hash: 'nm_default',
        },
      },
      global: {
        stubs: {
          BtnHelp: true,
          BtnPlain: true,
          DetailsItem: true,
          InputField: true,
          Truncate: true,
          Transition: false,
        },
        mocks: {
          $t: (key) => key,
        },
      },
    });

    wrapper.vm.transferAddress = 'ak_recipient';
    await wrapper.vm.transferName();

    expect(mockUpdateNamePointer).toHaveBeenCalledWith({
      name: 'default.chain',
      address: 'ak_recipient',
      type: 'transfer',
    });
    expect(mockPostJson).toHaveBeenNthCalledWith(1, 'https://backend.test/profile/ak_test', {
      body: {
        preferredChainName: '',
      },
    });
    expect(mockFetchRespondChallenge).toHaveBeenCalledWith({ challenge: true });
    expect(mockPostJson).toHaveBeenNthCalledWith(2, 'https://backend.test/profile/ak_test', {
      body: { signed: true },
    });
    expect(mockHandleUnknownError).not.toHaveBeenCalled();
  });
});
