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
const mockFetchMiddlewareStatus = vi.fn(async () => ({ mdwVersion: 'middleware-version' }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
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

vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: () => 'locale-specific-text',
  })),
}));

vi.mock('../../src/constants/environment', () => ({
  __esModule: true,
  IS_WEB: null,
  IN_FRAME: null,
  IS_MOBILE_DEVICE: false,
}));
vi.mock('../../src/composables', () => ({
  useAccounts: vi.fn(() => ({
    accounts: [],
    isLoggedIn: { value: false },
    activeAccount: { value: { protocol: 'aeternity', address: 'ak_test' } },
    protocolsInUse: ['aeternity'],
    addRawAccount: vi.fn(),
    discoverAccounts: vi.fn(),
    setActiveAccountByGlobalIdx: vi.fn(),
  })),
  useAeMiddleware: vi.fn(() => ({
    fetchMiddlewareStatus: vi.fn(),
  })),
  useModals: vi.fn(() => ({
    openModal: vi.fn(),
  })),
  useUi: vi.fn(() => ({
    setLoaderVisible: vi.fn(),
    loginTargetLocation: vi.fn(),
    isBiometricLoginEnabled: { value: false },
    saveErrorLog: { value: false },
    setSaveErrorLog: vi.fn(),
  })),
  useAuth: vi.fn(() => ({
    mnemonic: { value: '' },
    generateMnemonic: vi.fn(),
    setMnemonicAndInitializeAuthentication: vi.fn(),
    openEnableBiometricLoginModal: vi.fn(),
    checkBiometricLoginAvailability: vi.fn(async () => false),
    isMnemonicEncrypted: { value: false },
    isUsingDefaultPassword: { value: true },
    lockWallet: vi.fn(),
  })),
  useAeSdk: vi.fn(() => ({
    isNodeMainnet: { value: false },
    isNodeTestnet: { value: true },
  })),
  useAddressBook: vi.fn(() => ({
    addressBook: { value: {} },
  })),
  useCurrencies: vi.fn(() => ({
    currentCurrencyInfo: { value: { code: 'usd', symbol: '$' } },
  })),
  useNetworks: vi.fn(() => ({
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
    switchNetwork: vi.fn(),
    deleteCustomNetwork: vi.fn(),
  })),
}));
vi.mock('../../src/protocols/aeternity/composables', () => ({
  useAeMiddleware: vi.fn(() => ({
    fetchMiddlewareStatus: mockFetchMiddlewareStatus,
  })),
  useAeNetworkSettings: vi.fn(() => ({
    aeActiveNetworkSettings: {
      value: {
        middlewareUrl: 'https://testnet.middleware.aeternity.io',
        nodeUrl: 'https://testnet.aeternity.io',
      },
    },
  })),
}));
vi.mock('@/utils', () => ({
  fetchJson: vi.fn(() => ({})),
}));
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({})),
}));
vi.mock('detect-browser', () => ({
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
          PageWrapper: {
            template: '<div><slot /></div>',
          },
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
