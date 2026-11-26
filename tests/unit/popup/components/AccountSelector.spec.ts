import axe from 'axe-core';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';

import { PROTOCOLS } from '@/constants';
import AccountSelector from '@/popup/components/AccountSelector.vue';
import en from '@/popup/locales/en-US.json';
import { accessibleName } from '../../helpers/accessibleName';

const ADDRESS = 'ak_2swhLkgBPeeADxVTAVCJnZLY5NZtCFiM93JxsEaMuC59euuFRQ';

vi.mock('@/composables', async () => {
  const { ref } = await import('vue');
  return {
    useAccounts: () => ({
      accountsSelectOptions: ref([]),
      getAccountByProtocolAndAddress: () => undefined,
    }),
    useModals: () => ({ openModal: vi.fn() }),
  };
});

enableAutoUnmount(afterEach);

// Truncate measures itself; jsdom has no ResizeObserver
vi.stubGlobal('ResizeObserver', class {
  observe() {} // eslint-disable-line class-methods-use-this

  disconnect() {} // eslint-disable-line class-methods-use-this
});

function mountSelector(avatarOnly: boolean) {
  return mount(AccountSelector, {
    attachTo: document.body,
    props: {
      modelValue: ADDRESS,
      options: [{ text: 'Account 1', value: `${PROTOCOLS.aeternity}:${ADDRESS}` }],
      avatarOnly,
    },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
      stubs: { Avatar: true, AddressTruncated: true },
    },
  });
}

describe('AccountSelector', () => {
  it.each([false, true])('is a single button (avatar only: %s)', async (avatarOnly) => {
    const wrapper = mountSelector(avatarOnly);

    const { violations } = await axe.run(wrapper.element, { runOnly: ['nested-interactive'] });

    expect(violations.flatMap(({ nodes }) => nodes.map(({ html }) => html))).toEqual([]);
    expect(wrapper.findAll('button')).toHaveLength(1);
  });

  it.each([
    [false, 'Account 1'],
    [true, en.modals.createMultisigAccount.selectAccount],
  ])('names the selector (avatar only: %s)', (avatarOnly, name) => {
    const wrapper = mountSelector(avatarOnly);

    expect(accessibleName(wrapper.get('button').element)).toBe(name);
  });
});
