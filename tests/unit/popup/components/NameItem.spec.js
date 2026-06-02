import { mount } from '@vue/test-utils';
import { computed as mockComputed, ref as mockRef } from 'vue';

const mockPostJson = vi.fn();
const mockHandleUnknownError = vi.fn();
const mockOpenConfirmModal = vi.fn();
const mockUpdateNamePointer = vi.fn();
const mockUpdateOwnedNames = vi.fn();
const mockFetchRespondChallenge = vi.fn();
const mockSetDefaultName = vi.fn();
let NameItem;

vi.mock('@aeternity/aepp-sdk', () => ({
  Encoding: {
    AccountAddress: 'ak',
  },
  isAddressValid: vi.fn(() => true),
}));

vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: (key, params) => (params ? `${key}${JSON.stringify(params)}` : key),
  })),
}));

vi.mock('@/utils', () => ({
  blocksToRelativeTime: vi.fn(() => '1 day'),
  handleUnknownError: mockHandleUnknownError,
  postJson: mockPostJson,
}));

vi.mock('@/composables', () => ({
  useAccounts: vi.fn(() => ({
    activeAccount: mockRef({ address: 'ak_test' }),
  })),
  useAeSdk: vi.fn(() => ({
    nodeNetworkId: mockRef('ae_testnet'),
    fetchRespondChallenge: mockFetchRespondChallenge,
  })),
  useModals: vi.fn(() => ({
    openConfirmModal: mockOpenConfirmModal,
    openModal: vi.fn(),
  })),
  useTopHeaderData: vi.fn(() => ({
    topBlockHeight: mockRef(100),
  })),
}));

vi.mock('@/protocols/aeternity/composables/aeNames', () => ({
  NAME_CLAIM_STATUS: {
    preclaimed: 'preclaimed',
    claimSubmitted: 'claim-submitted',
    pointerUpdatePending: 'pointer-update-pending',
    transferring: 'transferring',
  },
  useAeNames: vi.fn(() => ({
    setAutoExtend: vi.fn(),
    updateNamePointer: mockUpdateNamePointer,
    getName: vi.fn(() => mockComputed(() => 'default.chain')),
    getNameExtendFee: vi.fn(() => 0.001),
    extendExpiringOwnedNames: vi.fn(),
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

vi.mock('@/protocols/aeternity/composables', () => ({
  useAeNetworkSettings: vi.fn(() => ({
    aeActiveNetworkSettings: mockRef({ backendUrl: 'https://backend.test' }),
  })),
}));

vi.mock('@/protocols/aeternity/helpers', () => ({
  checkAddressOrChannel: vi.fn(() => true),
}));

vi.mock('@/protocols/aeternity/config', () => ({
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

  beforeEach(async () => {
    vi.clearAllMocks();
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
