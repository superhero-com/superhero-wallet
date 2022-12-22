import Vue from 'vue';
import { mount, RouterLinkStub } from '@vue/test-utils';
import Index from '../../src/popup/pages/Index.vue';
import About from '../../src/popup/pages/About.vue';
import TermsOfService from '../../src/popup/pages/TermsOfService.vue';
import PrivacyPolicy from '../../src/popup/pages/PrivacyPolicy.vue';

Object.assign(Vue.prototype, {
  $t: () => 'locale-specific-text',
});

jest.mock('detect-browser', () => ({
  detect: () => ({}),
}));

describe('Pages', () => {
  [{
    name: 'Index',
    page: Index,
    options: {
      stubs: {
        RouterLink: RouterLinkStub,
        i18n: {
          template: '<span />',
        },
      },
    },
    data: [{
      termsAgreed: true,
      IS_WEB: true,
    },
    {
      IS_WEB: false,
    },
    {
      IN_FRAME: true,
    }],
  },
  {
    name: 'About',
    page: About,
    options: {
      stubs: {
        RouterLink: RouterLinkStub,
      },
    },
    data: [{
      extensionVersion: 'version-specific-text',
    }],
  },
  {
    name: 'TermsOfService',
    page: TermsOfService,
  },
  {
    name: 'PrivacyPolicy',
    page: PrivacyPolicy,
  }].forEach((test) => it(test.name, async () => {
    const wrapper = mount(test.page, {
      mocks: {
        $store: {
          getters: { activeNetwork: () => {} },
        },
      },
      ...test.options,
    });
    // eslint-disable-next-line no-restricted-syntax
    for (const data of test.data ?? [{}]) {
      // eslint-disable-next-line no-await-in-loop
      await wrapper.setData(data);
      expect(wrapper.element).toMatchSnapshot();
    }
  }));
});
