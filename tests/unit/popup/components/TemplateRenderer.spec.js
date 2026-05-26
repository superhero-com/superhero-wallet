import { shallowMount } from '@vue/test-utils';

import TemplateRenderer from '../../../../src/popup/components/TemplateRenderer.vue';

describe('TemplateRenderer', () => {
  it('renders URLs with query ampersands as text', () => {
    const str = 'Return to "https://example.com/success?address=ak_abc&networkId=ae_mainnet"?';
    const wrapper = shallowMount(TemplateRenderer, {
      props: { str },
    });

    expect(wrapper.text()).toContain('https://example.com/success?address=ak_abc&networkId=ae_mainnet');
    expect(wrapper.text()).not.toContain('EntityRef: expecting');
  });

  it('keeps supported inline markup', () => {
    const wrapper = shallowMount(TemplateRenderer, {
      props: { str: 'Use <strong>Confirm</strong> to continue' },
    });

    expect(wrapper.find('strong').exists()).toBe(true);
    expect(wrapper.text()).toContain('Use Confirm to continue');
  });
});
