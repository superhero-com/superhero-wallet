import { mount } from '@vue/test-utils';
import { computed as mockComputed, nextTick, ref as mockRef } from 'vue';

const mockHandleUnknownError = vi.fn();
const mockOpenConfirmModal = vi.fn();
const mockUpdateNamePointer = vi.fn();
const mockUpdateOwnedNames = vi.fn();
const mockChangeDefaultName = vi.fn();
// Shared in-flight marker owned by the aeNames composable; tests drive `.value`.
const mockSettingDefaultName = mockRef(null);
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
    // The set/clear-default flow (backend link/unlink + optimistic apply + the
    // shared in-flight guard) now lives in the composable; the component just
    // delegates. See `aeNames.spec.js` for that flow's own coverage.
    changeDefaultName: mockChangeDefaultName,
    settingDefaultName: mockSettingDefaultName,
    isAddressLinkSupported: mockRef(true),
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
    mockSettingDefaultName.value = null;
    mockOpenConfirmModal.mockResolvedValue(undefined);
    mockUpdateNamePointer.mockResolvedValue(true);
    mockUpdateOwnedNames.mockResolvedValue(undefined);
    mockChangeDefaultName.mockResolvedValue(undefined);
  });

  const STUBS = {
    BtnHelp: true,
    BtnPlain: true,
    DetailsItem: true,
    InputField: true,
    Truncate: true,
    Transition: false,
  };

  function mountNameItem(name, hash) {
    return mount(NameItem, {
      props: {
        nameEntry: {
          name,
          owner: 'ak_test',
          pending: false,
          pointers: { accountPubkey: 'ak_test' },
          createdAtHeight: 1,
          expiresAt: 150,
          autoExtend: false,
          hash,
        },
      },
      global: {
        stubs: STUBS,
        mocks: { $t: (key) => key },
      },
    });
  }

  it('delegates clearing the default to changeDefaultName when transferring without a fallback', async () => {
    const wrapper = mountNameItem('default.chain', 'nm_default');

    wrapper.vm.transferAddress = 'ak_recipient';
    await wrapper.vm.transferName();

    expect(mockUpdateNamePointer).toHaveBeenCalledWith({
      name: 'default.chain',
      address: 'ak_recipient',
      type: 'transfer',
    });
    // No other owned name to fall back to, so the default is cleared.
    expect(mockChangeDefaultName).toHaveBeenCalledWith('');
    expect(mockHandleUnknownError).not.toHaveBeenCalled();
  });

  it('delegates setting the default to changeDefaultName', async () => {
    // Distinct from the `getDefaultName` mock's 'default.chain' so `isDefault` is
    // false and the click is not short-circuited.
    const wrapper = mountNameItem('other.chain', 'nm_other');

    await wrapper.vm.handleSetDefault();

    expect(mockChangeDefaultName).toHaveBeenCalledWith('other.chain');
    expect(mockHandleUnknownError).not.toHaveBeenCalled();
  });

  it('reflects the shared in-flight marker: spinner on this row, disabled on the others', async () => {
    const wrapper = mountNameItem('other.chain', 'nm_other');

    expect(wrapper.vm.isSettingThisDefault).toBe(false);
    expect(wrapper.vm.isSettingDefaultInProgress).toBe(false);

    // A flow for THIS name spins this row (and disables it).
    mockSettingDefaultName.value = { address: 'ak_test', name: 'other.chain' };
    await nextTick();
    expect(wrapper.vm.isSettingThisDefault).toBe(true);
    expect(wrapper.vm.isSettingDefaultInProgress).toBe(true);

    // A flow for a DIFFERENT name of the same account only disables this row.
    mockSettingDefaultName.value = { address: 'ak_test', name: 'default.chain' };
    await nextTick();
    expect(wrapper.vm.isSettingThisDefault).toBe(false);
    expect(wrapper.vm.isSettingDefaultInProgress).toBe(true);
  });
});
