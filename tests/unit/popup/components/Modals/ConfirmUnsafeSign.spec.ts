import { enableAutoUnmount, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import { MemoryAccount, decode } from '@aeternity/aepp-sdk';

import ConfirmUnsafeSign from '@/popup/components/Modals/ConfirmUnsafeSign.vue';
import { useAccounts, usePopupProps } from '@/composables';
import { CONFIRM_GUARD_DELAY } from '@/composables/confirmGuard';
import { JWT_HEADER, PROTOCOLS } from '@/constants';
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

  it('shows the token an aepp asks to sign as it is signed, whichever account the user picks', async () => {
    const [active, picked] = [MemoryAccount.generate(), MemoryAccount.generate()]
      .map(({ address }) => ({ protocol: PROTOCOLS.aeternity, address }));
    // The wallet signs the aepp's bytes as they are, its key claim included
    const claims = JSON.stringify({
      challenge: 'n0nce',
      sub_jwk: {
        kty: 'OKP',
        crv: 'Ed25519',
        x: Buffer.from(decode(active.address)).toString('base64url'),
      },
    });
    usePopupProps().setPopupProps({
      protocol: PROTOCOLS.aeternity,
      app: {
        host: 'dapp.test', name: 'dapp.test', protocol: 'https:', href: 'https://dapp.test/',
      },
      data: Buffer.from(`${JWT_HEADER}.${Buffer.from(claims).toString('base64url')}`),
      resolve: vi.fn(),
      reject: vi.fn(),
    } as any);
    (useAccounts as any).mockReturnValue({
      getLastActiveProtocolAccount: () => active,
      setActiveAccountByAddressAndProtocol: vi.fn(),
    });
    const SignAccountSelect = { name: 'SignAccountSelect', props: ['account'], template: '<div />' };
    const wrapper = mount(ConfirmUnsafeSign, {
      global: {
        plugins: [i18n],
        stubs: {
          Modal: { template: '<div><slot /><slot name="footer" /></div>' },
          SignAccountSelect,
          TransactionInfo: true,
          DetailsItem: { template: '<div><slot /><slot name="value" /></div>' },
          CopyText: { props: ['value'], template: '<span>{{ value }}</span>' },
        },
      },
    });
    const shownMessage = () => wrapper.get('[data-cy=message]').text();
    expect(shownMessage()).toBe(claims);

    const select = wrapper.findComponent(SignAccountSelect);
    select.vm.$emit('select', picked);
    await nextTick();

    expect(select.props('account').address).toBe(picked.address);
    expect(shownMessage()).toBe(claims);
  });
});
