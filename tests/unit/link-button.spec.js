import { shallowMount } from '@vue/test-utils';
import LinkButton from '../../src/popup/components/LinkButton.vue';

describe('LinkButton', () => {
  it('should have correct "href" attribute', () => {
    const to = 'google.com';
    const wrapper = shallowMount(LinkButton, {
      props: { to },
    });
    expect(wrapper.find('.link-button').attributes().href).toEqual(to);
  });
});
