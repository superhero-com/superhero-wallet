import { mount } from '@vue/test-utils';
import { computed as mockComputed, ref as mockRef } from 'vue';

const mockHandleUnknownError = vi.fn();
const mockOpenConfirmModal = vi.fn();
const mockUpdateNamePointer = vi.fn();
const mockUpdateOwnedNames = vi.fn();
const mockLinkPreferredAensName = vi.fn();
const mockUnlinkPreferredAensName = vi.fn();
const mockSetDefaultNameOptimistic = vi.fn();
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
}));

vi.mock('@/composables', () => ({
  useAccounts: vi.fn(() => ({
    activeAccount: mockRef({ address: 'ak_test' }),
  })),
  useAeSdk: vi.fn(() => ({
    nodeNetworkId: mockRef('ae_testnet'),
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
    getDefaultName: vi.fn(() => mockComputed(() => 'default.chain')),
    getNameExtendFee: vi.fn(() => 0.001),
    extendExpiringOwnedNames: vi.fn(),
    ownedNames: mockRef([{
      name: 'default.chain',
      owner: 'ak_test',
      pending: false,
      pointers: { accountPubkey: 'ak_test' },
    }]),
    updateOwnedNames: mockUpdateOwnedNames,
    setDefaultNameOptimistic: mockSetDefaultNameOptimistic,
  })),
}));

vi.mock('@/protocols/aeternity/composables', () => ({
  useAeAddressLinkBackend: vi.fn(() => ({
    linkPreferredAensName: mockLinkPreferredAensName,
    unlinkPreferredAensName: mockUnlinkPreferredAensName,
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
    mockLinkPreferredAensName.mockResolvedValue('th_link');
    mockUnlinkPreferredAensName.mockResolvedValue('th_unlink');
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
    // Clearing the default name uses the signed unlink flow, not a link.
    expect(mockUnlinkPreferredAensName).toHaveBeenCalledWith('ak_test');
    expect(mockLinkPreferredAensName).not.toHaveBeenCalled();
    expect(mockSetDefaultNameOptimistic).toHaveBeenCalledWith({ address: 'ak_test', name: '' });
    expect(mockHandleUnknownError).not.toHaveBeenCalled();
  });

  it('sets the default name through the signed link flow', async () => {
    const wrapper = mount(NameItem, {
      props: {
        nameEntry: {
          // Distinct from the `getDefaultName` mock's 'default.chain' so `isDefault`
          // is false and the set-default guard doesn't block the call.
          name: 'other.chain',
          owner: 'ak_test',
          pending: false,
          pointers: { accountPubkey: 'ak_test' },
          createdAtHeight: 1,
          expiresAt: 150,
          autoExtend: false,
          hash: 'nm_other',
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

    await wrapper.vm.handleSetDefault();

    expect(mockLinkPreferredAensName).toHaveBeenCalledWith('ak_test', 'other.chain');
    expect(mockUnlinkPreferredAensName).not.toHaveBeenCalled();
    expect(mockSetDefaultNameOptimistic).toHaveBeenCalledWith({ address: 'ak_test', name: 'other.chain' });
    expect(mockHandleUnknownError).not.toHaveBeenCalled();
  });

  it('ignores repeated clicks while a set-default request is in flight', async () => {
    let resolveLink;
    mockLinkPreferredAensName.mockReturnValue(new Promise((resolve) => {
      resolveLink = resolve;
    }));

    const wrapper = mount(NameItem, {
      props: {
        nameEntry: {
          name: 'other.chain',
          owner: 'ak_test',
          pending: false,
          pointers: { accountPubkey: 'ak_test' },
          createdAtHeight: 1,
          expiresAt: 150,
          autoExtend: false,
          hash: 'nm_other',
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

    const firstCall = wrapper.vm.handleSetDefault();
    await wrapper.vm.handleSetDefault();
    await wrapper.vm.handleSetDefault();

    resolveLink('th_link');
    await firstCall;

    expect(mockLinkPreferredAensName).toHaveBeenCalledTimes(1);
    expect(mockSetDefaultNameOptimistic).toHaveBeenCalledTimes(1);
  });
});
