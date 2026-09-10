import { mount } from '@vue/test-utils';
import { defineRule } from 'vee-validate';
import TransferSendRecipient from '@/popup/components/TransferSend/TransferSendRecipient.vue';
import {
  PROTOCOLS,
  MODAL_ADDRESS_BOOK_ACCOUNT_SELECTOR,
  MODAL_RECIPIENT_INFO,
} from '@/constants';

/**
 * These rules are only registered for real by `src/popup/plugins/veeValidate.ts`'s
 * default export, which also boots `useBalances`/`useAeSdk` - overkill here. Trivial
 * pass-through rules stop vee-validate's `useField` from throwing "no such validator"
 * in the background; the component's own `errors` prop (not vee-validate's internal
 * state) drives every assertion below.
 */
beforeAll(() => {
  defineRule('required', () => true);
  defineRule('max_recipients', () => true);
  defineRule('address_not_same_as', () => true);
});

const {
  mockOpenModal,
  mockGetTippingUrlStatus,
  mockUseAeTippingUrls,
} = vi.hoisted(() => {
  const getTippingUrlStatus = vi.fn(() => 'default');
  return {
    mockOpenModal: vi.fn(),
    mockGetTippingUrlStatus: getTippingUrlStatus,
    mockUseAeTippingUrls: vi.fn(() => ({ getTippingUrlStatus })),
  };
});

/**
 * `@/composables` is the real barrel (spread via `importActual`) with only
 * `useAccounts`/`useModals` swapped out - everything else transitively needed by
 * real code loaded elsewhere in the same module graph (e.g. protocol adapters) stays
 * real. Same for the aeternity composables barrel: only `useAeTippingUrls` is
 * replaced, since a real one would trigger a live network fetch on mount.
 */
vi.mock('@/composables', async () => {
  const actual = await vi.importActual('@/composables');
  return {
    ...actual,
    useAccounts: () => ({ activeAccount: { value: { address: 'ak_activeAccount' } } }),
    useModals: () => ({ openModal: mockOpenModal }),
  };
});
vi.mock('@/protocols/aeternity/composables', async () => {
  const actual = await vi.importActual('@/protocols/aeternity/composables');
  return { ...actual, useAeTippingUrls: mockUseAeTippingUrls };
});

/** Renders the `label-after` slot (address-book/QR buttons)
 * without FormAccountInput's own logic. */
const FormAccountInputStub = {
  name: 'FormAccountInput',
  props: [
    'modelValue', 'name', 'showHelp', 'showMessageHelp', 'isRecipient',
    'singleDefaultFormat', 'isTipUrlEnabled', 'protocol', 'label', 'placeholder', 'message',
  ],
  emits: ['update:modelValue', 'help', 'blur'],
  template: '<div class="form-account-input-stub"><slot name="label-after" /></div>',
};
const UrlStatusStub = {
  name: 'UrlStatus',
  props: ['status'],
  template: '<div class="url-status-stub" />',
};

function mountComponent(props = {}) {
  return mount(TransferSendRecipient, {
    props: {
      protocol: PROTOCOLS.aeternity,
      errors: {},
      ...props,
    },
    global: {
      stubs: { FormAccountInput: FormAccountInputStub, UrlStatus: UrlStatusStub },
      mocks: { $t: (key) => key },
    },
  });
}

describe('TransferSendRecipient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTippingUrlStatus.mockReturnValue('default');
  });

  it('only eagerly fetches tipping URL data for the aeternity protocol', () => {
    mountComponent({ protocol: PROTOCOLS.aeternity });
    expect(mockUseAeTippingUrls).toHaveBeenCalledWith({ ensureFetchedOnInit: true });

    mountComponent({ protocol: PROTOCOLS.bitcoin });
    expect(mockUseAeTippingUrls).toHaveBeenCalledWith({ ensureFetchedOnInit: false });
  });

  it('surfaces a field validation error regardless of tip-url status', () => {
    mockGetTippingUrlStatus.mockReturnValue('verified');
    const wrapper = mountComponent({
      isTipUrl: true,
      errors: { addresses: 'validation.required' },
    });

    expect(wrapper.findComponent(FormAccountInputStub).props('message')).toEqual({
      status: 'error',
      text: 'validation.required',
    });
  });

  it('reports success when there are no errors and the field is not a tip URL', () => {
    const wrapper = mountComponent({ isTipUrl: false });
    expect(wrapper.findComponent(FormAccountInputStub).props('message')).toEqual({ status: 'success' });
  });

  it.each([
    ['verified', 'success'],
    ['not-secure', 'warning'],
    ['not-verified', 'warning'],
    ['blacklisted', 'error'],
  ])('maps tip-url status "%s" to a hidden %s message and forwards it to UrlStatus', (status, expectedStatus) => {
    mockGetTippingUrlStatus.mockReturnValue(status);
    const wrapper = mountComponent({ isTipUrl: true, modelValue: ['https://x.com/foo'] });

    expect(wrapper.findComponent(FormAccountInputStub).props('message')).toEqual({
      status: expectedStatus,
      text: '',
      hideMessage: true,
    });
    expect(wrapper.findComponent(UrlStatusStub).props('status')).toBe(status);
  });

  it('throws for an unrecognized tip-url status instead of silently misreporting trust', () => {
    mockGetTippingUrlStatus.mockReturnValue('made-up-status');
    expect(() => mountComponent({ isTipUrl: true, modelValue: ['https://x.com/foo'] }))
      .toThrow('Unknown url status: made-up-status');
  });

  it('opens the recipient help modal for the current protocol', async () => {
    mockOpenModal.mockResolvedValue(undefined);
    const wrapper = mountComponent({ protocol: PROTOCOLS.bitcoin });

    await wrapper.findComponent(FormAccountInputStub).vm.$emit('help');

    expect(mockOpenModal).toHaveBeenCalledWith(MODAL_RECIPIENT_INFO, {
      protocol: PROTOCOLS.bitcoin,
    });
  });

  it('opens the address book and emits the selected addresses', async () => {
    mockOpenModal.mockResolvedValue(['ak_one', 'ak_two']);
    const wrapper = mountComponent({ modelValue: ['ak_preexisting'], maxRecipients: 2 });

    await wrapper.find('[data-cy=address-book-button]').trigger('click');
    await wrapper.vm.$nextTick();
    await Promise.resolve();

    expect(mockOpenModal).toHaveBeenCalledWith(MODAL_ADDRESS_BOOK_ACCOUNT_SELECTOR, {
      preSelectedAddresses: ['ak_preexisting'],
      allowMultiple: true,
    });
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([['ak_one', 'ak_two']]);
  });

  it('does not emit when the address book modal resolves without a selection', async () => {
    mockOpenModal.mockResolvedValue(undefined);
    const wrapper = mountComponent();

    await wrapper.vm.selectFromAddressBook();

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('propagates a rejection when the address book modal is dismissed (no update emitted)', async () => {
    mockOpenModal.mockRejectedValue(new Error('modal closed'));
    const wrapper = mountComponent();

    await expect(wrapper.vm.selectFromAddressBook()).rejects.toThrow('modal closed');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('emits openQrModal when the scan button is clicked', async () => {
    const wrapper = mountComponent();

    await wrapper.find('[data-cy=scan-button]').trigger('click');

    expect(wrapper.emitted('openQrModal')).toHaveLength(1);
  });
});
