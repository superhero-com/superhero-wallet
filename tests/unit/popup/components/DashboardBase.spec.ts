import axe from 'axe-core';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';

import { ACCOUNT_TYPES, MODAL_ACCOUNT_SELECT_OPTIONS, PROTOCOLS } from '@/constants';
import DashboardBase from '@/popup/components/DashboardBase.vue';
import en from '@/popup/locales/en-US.json';
import zh from '@/popup/locales/zh-CN.json';
import type { IAccount, IFormSelectOption } from '@/types';
import { accessibleName } from '../../helpers/accessibleName';

const openModal = vi.fn();

vi.mock('@/composables', () => ({
  useUi: () => ({ isSeedBackedUp: ref(true) }),
  useModals: () => ({ openModal }),
}));

enableAutoUnmount(afterEach);

const accounts: IAccount[] = Array.from({ length: 7 }, (_, idx) => ({
  address: `ak_dashboardAccount${idx}`,
  protocol: PROTOCOLS.aeternity,
  type: ACCOUNT_TYPES.hdWallet,
  isRestored: true,
  idx,
  globalIdx: idx,
  publicKey: new Uint8Array(),
  secretKey: new Uint8Array(),
}));
const options: IFormSelectOption[] = accounts.slice(0, 6).map(({ address }, idx) => ({
  text: `Account ${idx + 1}`,
  value: `${PROTOCOLS.aeternity}:${address}`,
}));

function mountDashboard(locale = 'en-US') {
  return mount(DashboardBase, {
    attachTo: document.body,
    props: {
      accounts: accounts.slice(0, 6),
      accountsSelectOptions: options,
      activeAccountAddress: accounts[1].address,
      activeIdx: 1,
    },
    global: {
      plugins: [createI18n({
        legacy: false,
        locale,
        messages: { 'en-US': en, 'zh-CN': zh },
      })],
      stubs: {
        PageWrapper: { template: '<div><slot /></div>' },
        DashboardHeader: true,
        DashboardCard: true,
        TotalWalletAmount: true,
      },
    },
  });
}

describe('DashboardBase account selector', () => {
  beforeEach(() => {
    openModal.mockReset();
  });

  it.each([
    ['en-US', 'Select active account (2 / 6)'],
    ['zh-CN', '选择当前账户（2 / 6）'],
  ] as const)('includes the visible position in %s', (locale, expectedName) => {
    const wrapper = mountDashboard(locale);

    expect(wrapper.get('.account-number').text()).toBe('2 / 6');
    expect(accessibleName(wrapper.get('.account-select-btn').element)).toBe(expectedName);
  });

  it('updates the name when the selected position or account total changes', async () => {
    const wrapper = mountDashboard();

    await wrapper.setProps({ activeIdx: 3, activeAccountAddress: accounts[3].address });
    expect(accessibleName(wrapper.get('.account-select-btn').element)).toBe('Select active account (4 / 6)');

    await wrapper.setProps({ accounts });
    expect(wrapper.get('.account-number').text()).toBe('4 / 7');
    expect(accessibleName(wrapper.get('.account-select-btn').element)).toBe('Select active account (4 / 7)');
  });

  it('is a single button', async () => {
    const wrapper = mountDashboard();

    const { violations } = await axe.run(wrapper.element, { runOnly: ['nested-interactive'] });

    expect(violations.flatMap(({ nodes }) => nodes.map(({ html }) => html))).toEqual([]);
    expect(wrapper.findAll('button')).toHaveLength(1);
  });

  it('only shows the selector with more than five accounts and available options', async () => {
    const wrapper = mountDashboard();

    await wrapper.setProps({ accounts: accounts.slice(0, 5) });
    expect(wrapper.find('.account-select-btn').exists()).toBe(false);

    await wrapper.setProps({ accounts: accounts.slice(0, 6), accountsSelectOptions: null });
    expect(wrapper.find('.account-select-btn').exists()).toBe(false);

    await wrapper.setProps({ accountsSelectOptions: options });
    expect(wrapper.find('.account-select-btn').exists()).toBe(true);
  });

  it('retains the modal title and selected account identifier', async () => {
    const selectedValue = options[3].value;
    openModal.mockResolvedValueOnce(selectedValue);
    const wrapper = mountDashboard();

    await wrapper.get('.account-select-btn').trigger('click');
    await flushPromises();

    expect(openModal).toHaveBeenCalledOnce();
    expect(openModal).toHaveBeenCalledWith(MODAL_ACCOUNT_SELECT_OPTIONS, {
      value: options[1].value,
      options,
      title: 'Select active account',
      hideSearch: false,
    });
    expect(wrapper.emitted('select-account')).toEqual([[selectedValue]]);
  });
});
