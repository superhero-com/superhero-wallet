import { enableAutoUnmount, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';

import MessageSign from '@/popup/pages/Popups/MessageSign.vue';
import { useAccounts, useModals, usePopupProps } from '@/composables';
import { PROTOCOLS } from '@/constants';
import en from '@/popup/locales/en-US.json';

const ADDRESS = '0x1111111111111111111111111111111111111111';
const TYPED_DATA = {
  types: { Mail: [{ name: 'contents', type: 'string' }] },
  primaryType: 'Mail',
  domain: { chainId: 1 },
  message: { contents: 'Hello' },
};

vi.mock('@/composables', async () => ({
  useAccounts: vi.fn(),
  useModals: vi.fn(),
  usePopupProps: (await vi.importActual<any>('@/composables/popupProps')).usePopupProps,
}));

enableAutoUnmount(afterEach);

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

const EvmTypedDataSummaryStub = {
  name: 'EvmTypedDataSummary',
  props: ['protocol', 'typedData'],
  template: '<div />',
};

function mountModal(props: Record<string, any>) {
  usePopupProps().setPopupProps({
    app: {
      host: 'dapp.test', name: 'dapp.test', protocol: 'https:', href: 'https://dapp.test/',
    },
    message: JSON.stringify(TYPED_DATA),
    fromAccount: ADDRESS,
    resolve: vi.fn(),
    reject: vi.fn(),
    ...props,
  } as any);
  (useAccounts as any).mockReturnValue({
    getLastActiveProtocolAccount: vi.fn(),
    getAccountByProtocolAndAddress: vi.fn(() => ({ address: ADDRESS })),
    setActiveAccountByAddressAndProtocol: vi.fn(),
  });
  (useModals as any).mockReturnValue({ openModal: vi.fn() });
  return mount(MessageSign, {
    global: {
      plugins: [i18n],
      stubs: {
        Modal: { template: '<div><slot /><slot name="footer" /></div>' },
        SignAccountSelect: true,
        TransactionInfo: true,
        NoOriginWarning: true,
        BtnMain: true,
        CopyText: { template: '<div><slot /></div>' },
        EvmTypedDataSummary: EvmTypedDataSummaryStub,
      },
    },
  });
}

describe('MessageSign of EVM typed data', () => {
  it('explains the typed data, and still shows the message as it is', () => {
    const wrapper = mountModal({ protocol: PROTOCOLS.ethereum, evmTypedData: TYPED_DATA });

    expect(wrapper.findComponent(EvmTypedDataSummaryStub).props())
      .toEqual({ protocol: PROTOCOLS.ethereum, typedData: TYPED_DATA });
    expect(wrapper.find('[data-cy=message] .message-value').text()).toBe(JSON.stringify(TYPED_DATA));
  });

  it('explains nothing of a message without typed data', () => {
    const wrapper = mountModal({ protocol: PROTOCOLS.ethereum, message: 'Sign in' });

    expect(wrapper.findComponent(EvmTypedDataSummaryStub).exists()).toBe(false);
  });

  it('explains nothing of an aeternity message', () => {
    const wrapper = mountModal({ protocol: PROTOCOLS.aeternity, evmTypedData: TYPED_DATA });

    expect(wrapper.findComponent(EvmTypedDataSummaryStub).exists()).toBe(false);
  });
});
