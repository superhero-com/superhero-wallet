import { shallowMount } from '@vue/test-utils';
import LinkButton from '../../../../src/popup/components/LinkButton.vue';

describe('LinkButton', () => {
  it('should have correct "href" attribute', () => {
    const href = 'google.com';
    const wrapper = shallowMount(LinkButton, {
      props: { href },
    });
    expect(wrapper.find('.link-button').attributes().href).toEqual(href);
  });
});
