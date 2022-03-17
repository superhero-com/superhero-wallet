import { shallowMount } from '@vue/test-utils';
import Button from '../../src/popup/router/components/Button.vue';

describe('Button.vue', () => {
  it('adds prop.fill class', () => {
    const fill = 'primary';
    const wrapper = shallowMount(Button, {
      propsData: { fill },
    });
    expect(wrapper.find(`.${fill}`).exists()).toBeTruthy();
  });
});
