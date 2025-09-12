import { mount, RouterLinkStub } from '@vue/test-utils';
import Index from '../../src/popup/pages/Index.vue';
import About from '../../src/popup/pages/About.vue';
import TermsOfService from '../../src/popup/pages/TermsOfService.vue';
import PrivacyPolicy from '../../src/popup/pages/PrivacyPolicy.vue';
import More from '../../src/popup/pages/More.vue';
import Settings from '../../src/popup/pages/Settings.vue';
import Networks from '../../src/popup/pages/Networks.vue';
import * as environment from '../../src/constants/environment';

const OLD_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...OLD_ENV, npm_package_version: 'version-specific-text' };
});

afterAll(() => {
  process.env = OLD_ENV;
});

jest.mock('vue-i18n', () => ({
  useI18n: jest.fn(() => ({
    t: () => 'locale-specific-text',
  })),
}));

jest.mock('../../src/constants/environment', () => ({
  __esModule: true,
  IS_WEB: null,
  IN_FRAME: null,
  IS_MOBILE_DEVICE: false,
}));
jest.mock('../../src/composables', () => ({
  useAccounts: jest.fn(() => ({
    accounts: [],
    activeAccount: { value: { protocol: 'aeternity', address: 'ak_test' } },
    protocolsInUse: ['aeternity'],
  })),
  useAeMiddleware: jest.fn(() => ({
    fetchMiddlewareStatus: jest.fn(),
  })),
  useModals: jest.fn(() => ({
    openModal: jest.fn(),
  })),
  useUi: jest.fn(() => ({
    loginTargetLocation: jest.fn(),
    isBiometricLoginEnabled: { value: false },
    saveErrorLog: { value: false },
    setSaveErrorLog: jest.fn(),
  })),
  useAuth: jest.fn(() => ({
    openEnableBiometricLoginModal: jest.fn(),
    isMnemonicEncrypted: { value: false },
    isUsingDefaultPassword: { value: true },
    lockWallet: jest.fn(),
  })),
  useAeSdk: jest.fn(() => ({
    isNodeMainnet: { value: false },
    isNodeTestnet: { value: true },
  })),
  useAddressBook: jest.fn(() => ({
    addressBook: { value: {} },
  })),
  useCurrencies: jest.fn(() => ({
    currentCurrencyInfo: { value: { code: 'usd', symbol: '$' } },
  })),
  useNetworks: jest.fn(() => ({
    activeNetwork: {
      name: 'Testnet',
      type: 'Testnet',
      protocols: {
        aeternity: { nodeUrl: 'https://testnet.aeternity.io' },
      },
    },
    networks: [
      {
        name: 'Mainnet',
        type: 'Mainnet',
        protocols: {
          aeternity: { nodeUrl: 'https://mainnet.aeternity.io' },
        },
      },
      {
        name: 'Testnet',
        type: 'Testnet',
        protocols: {
          aeternity: { nodeUrl: 'https://testnet.aeternity.io' },
        },
      },
    ],
    switchNetwork: jest.fn(),
    deleteCustomNetwork: jest.fn(),
  })),
  useSuperheroId: jest.fn(() => ({
    hasSuperheroId: { value: false },
    syncSettings: jest.fn(),
  })),
}));
jest.mock('@/utils', () => ({
  fetchJson: jest.fn(() => ({})),
}));
jest.mock('vue-router', () => ({
  useRouter: jest.fn(() => ({})),
}));
jest.mock('detect-browser', () => ({
  detect: () => ({}),
}));

const testCases = [
  {
    name: 'Index',
    page: Index,
    data: {
      termsAgreed: true,
      IS_WEB: true,
    },
  },
  {
    name: 'Index',
    page: Index,
    data: {
      termsAgreed: true,
      IS_WEB: false,
    },
  },
  {
    name: 'Index',
    page: Index,
    data: {
      termsAgreed: true,
      IN_FRAME: true,
    },
  },
  {
    name: 'About',
    page: About,
  },
  {
    name: 'TermsOfService',
    page: TermsOfService,
  },
  {
    name: 'PrivacyPolicy',
    page: PrivacyPolicy,
  },
  {
    name: 'More',
    page: More,
  },
  {
    name: 'Settings',
    page: Settings,
  },
  {
    name: 'Networks',
    page: Networks,
  },
];

describe.each(testCases)('Pages', (test) => {
  it(test.name, async () => {
    // eslint-disable-next-line no-import-assign
    environment.IS_WEB = !!test.data?.IS_WEB;
    // eslint-disable-next-line no-import-assign
    environment.IN_FRAME = !!test.data?.IN_FRAME;

    const wrapper = mount(test.page, {
      global: {
        mocks: {
          $t: () => 'locale-specific-text',
          $tm: () => 'locale-specific-text',
        },
        stubs: {
          RouterLink: RouterLinkStub,
          'i18n-t': {
            template: '<span />',
          },
        },
      },
    });

    // Cannot change termsAgreed with setData() because it is inside setup()
    const checkmark = wrapper.find('input[type="checkbox"]');
    if (checkmark.exists() && test.data?.termsAgreed !== undefined) {
      await checkmark.setValue(test.data.termsAgreed);
      expect(checkmark.element.checked).toBe(test.data.termsAgreed);
      await wrapper.vm.$nextTick();
    }

    expect(wrapper.element).toMatchSnapshot();
  });
});
