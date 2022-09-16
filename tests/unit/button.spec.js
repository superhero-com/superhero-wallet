import { shallowMount } from '@vue/test-utils';
import BtnMain from '../../src/popup/components/buttons/BtnMain.vue';

describe('Button.vue', () => {
  it('adds prop.fill class', () => {
    const fill = 'primary';
    const wrapper = shallowMount(BtnMain, {
      propsData: { fill },
    });
    expect(wrapper.find(`.${fill}`).exists()).toBeTruthy();
  });
});
