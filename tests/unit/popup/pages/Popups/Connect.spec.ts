import { mount } from '@vue/test-utils';
import { expect, describe, it } from '@jest/globals';
import { createI18n } from 'vue-i18n';
import { nextTick } from 'vue';

import Connect from '@/popup/pages/Popups/Connect.vue';
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

function mountConnectWithPopupProps(popupProps: any = {}) {
  // @ts-ignore
  (usePopupProps as jest.Mock).mockReturnValue({
    popupProps: { value: popupProps },
  });

  // Stub accounts composable minimal surface
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
    setActiveAccountByAddress: jest.fn(),
  });

  return mount(Connect, {
    global: {
      plugins: [i18n],
      stubs: {
        // Avoid deep-rendering dependencies
        Modal: {
          template: '<div><slot /><slot name="footer" /></div>',
        },
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

describe('Connect.vue', () => {
  it('uses popupProps.protocol when props are present via popup', async () => {
    const wrapper = mountConnectWithPopupProps({ protocol: PROTOCOLS.aeternity });
    await nextTick();
    const base = wrapper.findComponent(ConnectBase);
    expect(base.exists()).toBe(true);
    // Ensure Connect.vue forwards popupProps.protocol to child
    expect((base.props() as any).protocol).toBe(PROTOCOLS.aeternity);
  });

  it('aggregates options from supportedProtocols (popupProps)', async () => {
    const wrapper = mountConnectWithPopupProps({
      protocol: PROTOCOLS.aeternity,
      supportedProtocols: [PROTOCOLS.aeternity],
    });
    await nextTick();
    const base = wrapper.findComponent(ConnectBase);
    expect(base.exists()).toBe(true);
  });
});
