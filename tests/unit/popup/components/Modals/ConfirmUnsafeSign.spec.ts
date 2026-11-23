import { enableAutoUnmount, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';

import ConfirmUnsafeSign from '@/popup/components/Modals/ConfirmUnsafeSign.vue';
import { useAccounts, usePopupProps } from '@/composables';
import { CONFIRM_GUARD_DELAY } from '@/composables/confirmGuard';
import { PROTOCOLS } from '@/constants';
import en from '@/popup/locales/en-US.json';

const ADDRESS = 'ak_activeAccountAddress0000000000000000000000000000000';

vi.mock('@/composables', async () => ({
  useAccounts: vi.fn(),
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

describe('ConfirmUnsafeSign', () => {
  it('signs in a detached approval only after its confirmation guard expires', async () => {
    vi.useFakeTimers();
    try {
      const resolve = vi.fn();
      const setActiveAccountByAddressAndProtocol = vi.fn();
      usePopupProps().setPopupProps({
        protocol: PROTOCOLS.aeternity,
        app: {
          host: 'dapp.test', name: 'dapp.test', protocol: 'https:', href: 'https://dapp.test/',
        },
        data: Buffer.from('payload'),
        resolve,
        reject: vi.fn(),
      } as any);
      (useAccounts as any).mockReturnValue({
        getLastActiveProtocolAccount: () => ({ protocol: PROTOCOLS.aeternity, address: ADDRESS }),
        setActiveAccountByAddressAndProtocol,
      });
      const wrapper = mount(ConfirmUnsafeSign, {
        global: {
          plugins: [i18n],
          stubs: {
            Modal: { template: '<div><slot /><slot name="footer" /></div>' },
            SignAccountSelect: true,
            TransactionInfo: true,
            DetailsItem: true,
          },
        },
      });
      const accept = wrapper.get<HTMLButtonElement>('[data-cy=accept]');

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
});
