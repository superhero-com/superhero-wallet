import { mount, RouterLinkStub } from '@vue/test-utils';
import { nextTick } from 'vue';
import Index from '../../src/popup/pages/Index.vue';
import About from '../../src/popup/pages/About.vue';
import TermsOfService from '../../src/popup/pages/TermsOfService.vue';
import PrivacyPolicy from '../../src/popup/pages/PrivacyPolicy.vue';
import More from '../../src/popup/pages/More.vue';
import Settings from '../../src/popup/pages/Settings.vue';
import Networks from '../../src/popup/pages/Networks.vue';
import * as environment from '../../src/constants/environment';

const OLD_ENV = process.env;
const mockFetchMiddlewareStatus = jest.fn(async () => ({ mdwVersion: 'middleware-version' }));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  process.env = {
    ...OLD_ENV,
    npm_package_version: 'version-specific-text',
    COMMIT_HASH: 'commit-specific-text',
    SDK_VERSION: 'sdk-specific-text',
  };
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
    isLoggedIn: { value: false },
    activeAccount: { value: { protocol: 'aeternity', address: 'ak_test' } },
    protocolsInUse: ['aeternity'],
    addRawAccount: jest.fn(),
    discoverAccounts: jest.fn(),
    setActiveAccountByGlobalIdx: jest.fn(),
  })),
  useAeMiddleware: jest.fn(() => ({
    fetchMiddlewareStatus: jest.fn(),
  })),
  useModals: jest.fn(() => ({
    openModal: jest.fn(),
  })),
  useUi: jest.fn(() => ({
    setLoaderVisible: jest.fn(),
    loginTargetLocation: jest.fn(),
    isBiometricLoginEnabled: { value: false },
    saveErrorLog: { value: false },
    setSaveErrorLog: jest.fn(),
  })),
  useAuth: jest.fn(() => ({
    mnemonic: { value: '' },
    generateMnemonic: jest.fn(),
    setMnemonicAndInitializeAuthentication: jest.fn(),
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
}));
jest.mock('../../src/protocols/aeternity/composables', () => ({
  useAeMiddleware: jest.fn(() => ({
    fetchMiddlewareStatus: mockFetchMiddlewareStatus,
  })),
  useAeNetworkSettings: jest.fn(() => ({
    aeActiveNetworkSettings: {
      value: {
        middlewareUrl: 'https://testnet.middleware.aeternity.io',
        nodeUrl: 'https://testnet.aeternity.io',
      },
    },
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
    },
    assertions: (wrapper) => {
      expect(wrapper.find('.index').exists()).toBe(true);
      expect(wrapper.find('[data-cy="checkbox"]').exists()).toBe(true);
      expect(wrapper.find('[data-cy="terms"]').exists()).toBe(true);
      expect(wrapper.find('[data-cy="generate-wallet"]').exists()).toBe(true);
      expect(wrapper.find('[data-cy="import-wallet"]').exists()).toBe(true);
    },
  },
  {
    name: 'About',
    page: About,
    assertions: (wrapper) => {
      expect(wrapper.find('.about').exists()).toBe(true);
      expect(wrapper.find('.additional-links').exists()).toBe(true);
      expect(wrapper.text()).toContain('Superhero Wallet');
      expect(wrapper.find('a[href*="github.com/aeternity/superhero-wallet/commit"]').exists()).toBe(true);
    },
  },
  {
    name: 'TermsOfService',
    page: TermsOfService,
    assertions: (wrapper) => {
      expect(wrapper.find('[data-cy="terms-of-service"]').exists()).toBe(true);
      expect(wrapper.text()).toContain('TERMS OF USE');
    },
  },
  {
    name: 'PrivacyPolicy',
    page: PrivacyPolicy,
    assertions: (wrapper) => {
      expect(wrapper.find('[data-cy="privacy-policy"]').exists()).toBe(true);
      expect(wrapper.text()).toContain('Privacy Policy');
    },
  },
  {
    name: 'More',
    page: More,
    assertions: (wrapper) => {
      expect(wrapper.find('[data-cy="settings"]').exists()).toBe(true);
      expect(wrapper.find('[data-cy="address-book"]').exists()).toBe(true);
      expect(wrapper.find('[data-cy="tips-claim"]').exists()).toBe(true);
      expect(wrapper.find('[data-cy="invite"]').exists()).toBe(true);
      expect(wrapper.find('[data-cy="about"]').exists()).toBe(true);
    },
  },
  {
    name: 'Settings',
    page: Settings,
    assertions: (wrapper) => {
      expect(wrapper.find('[data-cy="networks-settings"]').exists()).toBe(true);
      expect(wrapper.find('[data-cy="token-sales"]').exists()).toBe(true);
      expect(wrapper.text()).toContain('Testnet');
      expect(wrapper.text()).toContain('USD ($)');
    },
  },
  {
    name: 'Networks',
    page: Networks,
    assertions: (wrapper) => {
      expect(wrapper.find('[data-cy="networks"]').exists()).toBe(true);
      expect(wrapper.find('[data-cy="to-add"]').exists()).toBe(true);
      expect(wrapper.text()).toContain('Mainnet');
      expect(wrapper.text()).toContain('Testnet');
    },
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
    await nextTick();

    // Cannot change termsAgreed with setData() because it is inside setup()
    const checkmark = wrapper.find('input[type="checkbox"]');
    if (checkmark.exists() && test.data?.termsAgreed !== undefined) {
      await checkmark.setValue(test.data.termsAgreed);
      expect(checkmark.element.checked).toBe(test.data.termsAgreed);
      await nextTick();
    }

    test.assertions(wrapper);
  });
});
