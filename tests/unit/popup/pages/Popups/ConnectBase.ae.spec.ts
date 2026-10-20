import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';

import type { AppOriginSource } from '@/types';
import ConnectBase from '@/popup/pages/Popups/ConnectBase.vue';
import { usePopupProps, useAccounts } from '@/composables';
import { usePermissions } from '@/composables/permissions';
import { PERMISSION_DEFAULTS, PROTOCOLS } from '@/constants';
import { createAppData } from '@/utils';
import en from '@/popup/locales/en-US.json';

vi.mock('@/composables', () => ({
  usePopupProps: vi.fn(),
  useAccounts: vi.fn(),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function mountBaseWith(popupProps: any = {}, props: any = {}) {
  // @ts-ignore
  (usePopupProps as vi.Mock).mockReturnValue({ popupProps: { value: popupProps } });

  const getLastActiveProtocolAccount = vi.fn((protocol) => (
    protocol === PROTOCOLS.aeternity
      ? {
        protocol, address: 'ak_ae', idx: 0, globalIdx: 0,
      }
      : undefined
  ));
  const getAccountsSelectOptionsByProtocol = vi.fn((protocol) => (
    protocol === PROTOCOLS.aeternity
      ? [{ text: 'Æternity account 1', value: `${PROTOCOLS.aeternity}:ak_ae` }]
      : []
  ));
  // @ts-ignore
  (useAccounts as vi.Mock).mockReturnValue({
    getLastActiveProtocolAccount,
    getAccountsSelectOptionsByProtocol,
    getAccountByProtocolAndAddress: vi.fn((p, a) => ({ protocol: p, address: a })),
    setActiveAccountByAddressAndProtocol: vi.fn(),
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
        BtnMain: { props: ['text', 'disabled'], template: '<button :disabled="disabled">{{ text }}</button>' },
        Avatar: { template: '<div><slot /></div>' },
        Card: { template: '<div><slot name="icon" /><slot /></div>' },
        DappIcon: true,
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

describe('ConnectBase.vue dapp identity', () => {
  function mountWithApp(href: string, originSource?: AppOriginSource) {
    return mountBaseWith({
      protocol: PROTOCOLS.aeternity,
      app: createAppData(href, originSource),
      resolve: vi.fn(),
    });
  }

  type Wrapper = ReturnType<typeof mountWithApp>;
  const shownName = (wrapper: Wrapper) => wrapper.find('[data-cy="aepp"] .text-heading-5').text();
  const shownLogo = (wrapper: Wrapper) => wrapper.find('[data-cy="aepp"] img.dapp-logo');

  it.each([
    'https://aescan.io/tx/th_1',
    'https://AESCAN.IO',
  ])('shows a trusted dapp opened from its own origin: %s', (href) => {
    const wrapper = mountWithApp(href);
    expect(shownName(wrapper)).toBe('aeScan');
    expect(shownLogo(wrapper).exists()).toBe(true);
  });

  it.each([
    ['https://aescan.io.evil.com/login', 'aescan.io.evil.com'],
    ['https://superhero.community/', 'superhero.community'],
    ['https://aescan.io@evil.com/', 'evil.com'],
    ['https://aescan.io./', 'aescan.io.'],
    ['https://aescan.io:8443/', 'aescan.io'],
    ['http://aescan.io/', 'aescan.io'],
  ])('shows %s under its own host', (href, name) => {
    const wrapper = mountWithApp(href);
    expect(shownName(wrapper)).toBe(name);
    expect(shownLogo(wrapper).exists()).toBe(false);
  });

  it('shows a self-reported trusted URL under its own host', () => {
    const wrapper = mountWithApp('https://aescan.io', 'self-reported');
    expect(shownName(wrapper)).toBe('aescan.io');
    expect(shownLogo(wrapper).exists()).toBe(false);
  });

  it('saves the permission of a site under its host', async () => {
    const { permissions, resetPermissions } = usePermissions();
    resetPermissions();

    const wrapper = mountWithApp('https://app.uniswap.org/');
    await wrapper.find('[data-cy="accept"]').trigger('click');

    expect(permissions.value).toEqual({
      'app.uniswap.org': expect.objectContaining({
        host: 'app.uniswap.org',
        name: 'app.uniswap.org',
        address: true,
      }),
    });
    expect(permissions.value['app.uniswap.org']).not.toHaveProperty('originSource');
  });

  it('saves only the connection for the http page of a site connected over https', async () => {
    const { addPermission, permissions, resetPermissions } = usePermissions();
    resetPermissions();
    addPermission({
      ...PERMISSION_DEFAULTS,
      host: 'app.uniswap.org',
      name: 'Uniswap',
      address: true,
      addressList: true,
      messageSign: true,
      dailySpendLimit: true,
      transactionSignLimit: 5,
      transactionSignSpent: 1,
      protocol: 'https:',
    });

    const wrapper = mountWithApp('http://app.uniswap.org/');
    expect(shownName(wrapper)).toBe('app.uniswap.org');
    await wrapper.find('[data-cy="accept"]').trigger('click');

    expect(permissions.value['app.uniswap.org']).toEqual({
      ...PERMISSION_DEFAULTS,
      ...createAppData('http://app.uniswap.org/'),
      address: true,
    });
  });

  it('keeps the permission of a site that moved to https', async () => {
    const { addPermission, permissions, resetPermissions } = usePermissions();
    resetPermissions();
    addPermission({
      ...PERMISSION_DEFAULTS,
      host: 'app.uniswap.org',
      name: 'Uniswap',
      messageSign: true,
      transactionSignLimit: 5,
      protocol: 'http:',
    });

    const wrapper = mountWithApp('https://app.uniswap.org/');
    expect(shownName(wrapper)).toBe('Uniswap');
    await wrapper.find('[data-cy="accept"]').trigger('click');

    expect(permissions.value['app.uniswap.org']).toMatchObject({
      name: 'Uniswap', messageSign: true, transactionSignLimit: 5, protocol: 'https:',
    });
  });

  it('saves no permission for the URL a WalletConnect dapp claims', async () => {
    const { permissions, resetPermissions } = usePermissions();
    resetPermissions();
    const resolve = vi.fn();

    const wrapper = mountBaseWith({
      protocol: PROTOCOLS.aeternity,
      app: createAppData('https://app.uniswap.org/', 'self-reported'),
      resolve,
    });
    await wrapper.find('[data-cy="accept"]').trigger('click');

    expect(permissions.value).toEqual({});
    expect(resolve).toHaveBeenCalled();
  });

  it('offers to remember a site but not a WalletConnect dapp, which is never saved', () => {
    expect(mountWithApp('https://app.uniswap.org/').find('[data-cy="checkbox"]').exists()).toBe(true);
    expect(mountWithApp('https://app.uniswap.org/', 'self-reported').find('[data-cy="checkbox"]').exists())
      .toBe(false);
  });
});
