import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';

import SignAccountSelect from '@/popup/components/SignAccountSelect.vue';
import { useAccounts } from '@/composables';
import { PROTOCOLS } from '@/constants';
import en from '@/popup/locales/en-US.json';

vi.mock('@/composables', () => ({
  useAccounts: vi.fn(),
}));

const ADDRESS_ACTIVE = 'ak_activeAccountAddress0000000000000000000000000000000';
const ADDRESS_PREPARED = 'ak_preparedAccountAddress00000000000000000000000000000';

const accountActive = {
  protocol: PROTOCOLS.aeternity, address: ADDRESS_ACTIVE, idx: 0, globalIdx: 0,
};
const accountPrepared = {
  protocol: PROTOCOLS.aeternity, address: ADDRESS_PREPARED, idx: 1, globalIdx: 1,
};
const walletAccounts = [accountActive, accountPrepared];

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

const options = walletAccounts.map(({ address }, idx) => ({
  text: `Æternity account ${idx + 1}`,
  value: `${PROTOCOLS.aeternity}:${address}`,
}));

const getAccountsSelectOptionsByProtocol = vi.fn(() => options);
const getAccountByProtocolAndAddress = vi.fn(
  (protocol, address) => walletAccounts.find(
    (acc) => acc.protocol === protocol && acc.address === address,
  ),
);

const FormSelectStub = {
  name: 'FormSelect',
  props: ['modelValue', 'options', 'defaultText'],
  template: '<div class="form-select-stub"><slot name="current-text" /></div>',
};

function mountWith(props: any = {}) {
  // @ts-ignore
  (useAccounts as vi.Mock).mockReturnValue({
    getAccountsSelectOptionsByProtocol,
    getAccountByProtocolAndAddress,
  });

  return mount(SignAccountSelect, {
    props: {
      protocol: PROTOCOLS.aeternity,
      account: accountActive,
      ...props,
    },
    global: {
      plugins: [i18n],
      stubs: {
        FormSelect: FormSelectStub,
        AccountSelectOptionsItem: true,
      },
    },
  });
}

const findHint = (wrapper: any) => wrapper.find('[data-cy="sign-account-original-hint"]');

describe('SignAccountSelect.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('offers every account of the protocol and shows the selected one', () => {
    const wrapper = mountWith();

    expect(getAccountsSelectOptionsByProtocol).toHaveBeenCalledWith(PROTOCOLS.aeternity);
    expect(wrapper.findComponent(FormSelectStub).props('options')).toEqual(options);
    expect(
      wrapper.findComponent({ name: 'AccountSelectOptionsItem' }).props('customAccount'),
    ).toEqual(accountActive);
  });

  it('emits the resolved account when a different one is picked', async () => {
    const wrapper = mountWith();

    await wrapper.findComponent(FormSelectStub).vm.$emit(
      'select',
      `${PROTOCOLS.aeternity}:${ADDRESS_PREPARED}`,
    );

    expect(wrapper.emitted('select')).toHaveLength(1);
    expect(wrapper.emitted('select')![0]).toEqual([accountPrepared]);
  });

  it('does not emit for an address that is not in the wallet', async () => {
    const wrapper = mountWith();

    await wrapper.findComponent(FormSelectStub).vm.$emit('select', `${PROTOCOLS.aeternity}:ak_nope`);

    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('renders no hint when the action is not tied to a specific account', () => {
    // Message / raw / unsafe sign have no sender baked into the payload.
    expect(findHint(mountWith()).exists()).toBe(false);
  });

  it('stays quiet when the selected account is the prepared one', () => {
    // The expected case needs no commentary.
    const wrapper = mountWith({
      account: accountPrepared,
      originalAddress: ADDRESS_PREPARED,
    });

    expect(findHint(wrapper).exists()).toBe(false);
  });

  it('warns, naming the prepared account, when signing with another account', () => {
    const wrapper = mountWith({
      account: accountActive,
      originalAddress: ADDRESS_PREPARED,
    });

    const hint = findHint(wrapper);
    expect(hint.exists()).toBe(true);
    // The prepared account is named so the user can tell which one the dapp meant.
    expect(hint.text()).toContain(ADDRESS_PREPARED.slice(0, 6));
    expect(hint.text()).toContain('will be rejected by the network');
  });

  it('warns when the transaction was prepared for an account the wallet does not hold', () => {
    const wrapper = mountWith({
      account: accountActive,
      originalAddress: ADDRESS_PREPARED,
      signerAccountMissing: true,
    });

    const hint = findHint(wrapper);
    expect(hint.exists()).toBe(true);
    expect(hint.text()).toContain('not available in this wallet');
  });
});
