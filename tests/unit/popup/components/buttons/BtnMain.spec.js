import { mount } from '@vue/test-utils';
import BtnMain from '../../../../../src/popup/components/buttons/BtnMain.vue';

describe('BtnMain', () => {
  it('handles properly the variants', () => {
    const variant = 'primary';
    const wrapper = mount(BtnMain, {
      props: { variant },
    });
    expect(wrapper.classes()).toContain(`variant-${variant}`);
  });
});
