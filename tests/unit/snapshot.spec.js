import { mount, RouterLinkStub } from '@vue/test-utils';
import Vuex from 'vuex';
import Index from '../../src/popup/pages/Index.vue';
import About from '../../src/popup/pages/About.vue';
import TermsOfService from '../../src/popup/pages/TermsOfService.vue';
import PrivacyPolicy from '../../src/popup/pages/PrivacyPolicy.vue';
import * as environment from '../../src/constants/environment';

const OLD_ENV = process.env;

const store = new Vuex.Store({ state: {}, getters: {} });

beforeEach(() => {
  jest.resetModules();
  process.env = { ...OLD_ENV, npm_package_version: 'version-specific-text' };
});

afterAll(() => {
  process.env = OLD_ENV;
});

jest.mock('../../src/constants/environment', () => ({
  __esModule: true,
  IS_WEB: null,
  IN_FRAME: null,
  IS_MOBILE_DEVICE: false,
}));
jest.mock('../../src/composables', () => ({
  useMiddleware: jest.fn(() => ({
    fetchMiddlewareStatus: jest.fn(),
  })),
  useModals: jest.fn(() => ({
    openModal: jest.fn(),
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
];

describe.each(testCases)('Pages', (test) => {
  it(test.name, async () => {
    environment.IS_WEB = !!test.data?.IS_WEB;
    environment.IN_FRAME = !!test.data?.IN_FRAME;

    const wrapper = mount(test.page, {
      global: {
        plugins: [store],
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
