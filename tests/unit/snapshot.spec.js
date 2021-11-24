import Vue from 'vue';
import { mount, RouterLinkStub } from '@vue/test-utils';
import Index from '../../src/popup/router/pages/Index.vue';
import About from '../../src/popup/router/pages/About.vue';
import TermsOfService from '../../src/popup/router/pages/TermsOfService.vue';
import PrivacyPolicy from '../../src/popup/router/pages/PrivacyPolicy.vue';
import Intro from '../../src/popup/router/pages/Intro.vue';

Object.assign(Vue.prototype, {
  $t: () => 'locale-specific-text',
});

describe('Pages', () => {
  [{
    name: 'Index',
    page: Index,
    options: {
      stubs: {
        RouterLink: RouterLinkStub,
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
      stubs: ['router-link'],
    },
    data: [{}],
  },
  {
    name: 'TermsOfService',
    page: TermsOfService,
    data: [{}],
  },
  {
    name: 'PrivacyPolicy',
    page: PrivacyPolicy,
    data: [{}],
  },
  {
    name: 'Intro',
    page: Intro,
    data: [{
      step: 1,
    },
    {
      step: 2,
    },
    {
      step: 3,
    },
    {
      step: 4,
    }],
  }].forEach((test) => it(test.name, async () => {
    const wrapper = mount(test.page, test.options);
    test.data.forEach(async (data) => {
      await wrapper.setData(data);
      expect(wrapper.element).toMatchSnapshot();
    });
  }));
});
