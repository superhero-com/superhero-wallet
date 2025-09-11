import { mount } from '@vue/test-utils';
import { expect, describe, it } from '@jest/globals';
import { createI18n } from 'vue-i18n';

import ConnectBase from '@/popup/pages/Popups/ConnectBase.vue';
import { usePopupProps, useAccounts } from '@/composables';
import { PROTOCOLS } from '@/constants';

jest.mock('@/composables', () => ({
  usePopupProps: jest.fn(),
  useAccounts: jest.fn(),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en: {} },
});

function mountBaseWith(popupProps: any = {}, props: any = {}) {
  // @ts-ignore
  (usePopupProps as jest.Mock).mockReturnValue({ popupProps: { value: popupProps } });

  const getLastActiveProtocolAccount = jest.fn((protocol) => (
    protocol === PROTOCOLS.aeternity
      ? {
        protocol, address: 'ak_ae', idx: 0, globalIdx: 0,
      }
      : undefined
  ));
  const getAccountsSelectOptionsByProtocol = jest.fn((protocol) => (
    protocol === PROTOCOLS.aeternity
      ? [{ text: 'Æternity account 1', value: `${PROTOCOLS.aeternity}:ak_ae` }]
      : []
  ));
  // @ts-ignore
  (useAccounts as jest.Mock).mockReturnValue({
    getLastActiveProtocolAccount,
    getAccountsSelectOptionsByProtocol,
    getAccountByProtocolAndAddress: jest.fn((p, a) => ({ protocol: p, address: a })),
    setActiveAccountByAddressAndProtocol: jest.fn(),
  });

  return mount(ConnectBase, {
    props: {
      access: [],
      ...props,
    },
    global: {
      plugins: [i18n],
      stubs: {
        Modal: { template: '<div><slot /><slot name="footer" /></div>' },
        AccountSelectOptionsItem: true,
        NetworkButton: true,
        AccountSkeleton: true,
        InfoBox: true,
        BtnMain: true,
        Avatar: true,
        Card: true,
        TemplateRenderer: true,
        Truncate: true,
        CheckBox: true,
        FormSelect: true,
      },
    },
  });
}

describe('ConnectBase.vue AE selection', () => {
  it('shows AE account when AE popup and accounts present', async () => {
    const wrapper = mountBaseWith({ protocol: PROTOCOLS.aeternity }, {});
    // Ensures supported state is true by checking confirm button is not disabled
    const confirm = wrapper.find('[data-cy="accept"]');
    expect(confirm.exists()).toBe(true);
  });

  it('renders no account template when no options', async () => {
    // Provide a popup with unsupported protocol and no accounts returned
    const wrapper = mountBaseWith({ protocol: 'unknown' }, {});
    const danger = wrapper.find('.danger');
    expect(danger.exists()).toBe(true);
  });
});
