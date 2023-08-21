import { shallowMount } from '@vue/test-utils';
import InputRange from '../../src/popup/components/InputRange.vue';

describe('InputRange', () => {
  it('should render', async () => {
    const wrapper = shallowMount(InputRange);
    expect(wrapper.find('.input-range').exists()).toBeTruthy();
  });
  [5, '5'].forEach((value) => it('should emit number value on input', async () => {
    const wrapper = shallowMount(InputRange, {
      props: {
        min: 0,
        max: 10,
      },
    });
    await wrapper.find('.input-range').setValue(value);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('input')).toBeTruthy();
    expect(wrapper.emitted('input')[0]).toEqual([+value]);
  }));
});
