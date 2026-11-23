import { enableAutoUnmount, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';

import MessageSign from '@/popup/pages/Popups/MessageSign.vue';
import { useAccounts, useModals, usePopupProps } from '@/composables';
import { CONFIRM_GUARD_DELAY } from '@/composables/confirmGuard';
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
vi.mock('@/constants', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/constants')>(),
  IS_EXTENSION: true,
  RUNNING_IN_POPUP: true,
  IS_SIDE_PANEL: false,
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
        CopyText: { template: '<div><slot /></div>' },
        EvmTypedDataSummary: EvmTypedDataSummaryStub,
      },
    },
  });
}

describe('MessageSign', () => {
  it('accepts a detached signature request only after its confirmation guard expires', async () => {
    vi.useFakeTimers();
    try {
      const resolve = vi.fn();
      const wrapper = mountModal({ protocol: PROTOCOLS.ethereum, resolve });
      const accept = wrapper.get<HTMLButtonElement>('[data-cy=accept]');
      const { setActiveAccountByAddressAndProtocol } = useAccounts();

      accept.element.click();
      expect(accept.attributes('aria-disabled')).toBe('true');
      expect(setActiveAccountByAddressAndProtocol).not.toHaveBeenCalled();
      expect(resolve).not.toHaveBeenCalled();

      vi.advanceTimersByTime(CONFIRM_GUARD_DELAY);
      await nextTick();
      expect(accept.attributes('aria-disabled')).toBeUndefined();
      accept.element.click();
      expect(resolve).toHaveBeenCalledExactlyOnceWith({ selectedAddress: ADDRESS });
    } finally {
      vi.useRealTimers();
    }
  });

  it('can reject a newly opened signature request immediately', () => {
    const reject = vi.fn();
    const wrapper = mountModal({ protocol: PROTOCOLS.ethereum, reject });
    wrapper.get<HTMLButtonElement>('[data-cy=deny]').element.click();
    expect(reject).toHaveBeenCalledOnce();
  });

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
