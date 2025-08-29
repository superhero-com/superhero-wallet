import { shallowMount } from '@vue/test-utils';
import InputField from '../../../../src/popup/components/InputField.vue';

describe('Input field', () => {
  it('should render', async () => {
    const wrapper = shallowMount(InputField);
    expect(wrapper.find('.input-field').exists()).toBeTruthy();
  });
  [1234, 'test input'].forEach((value) => it('should emit string value on input', async () => {
    const wrapper = shallowMount(InputField);
    await wrapper.find('input').setValue(value);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([value.toString()]);
  }));
  it('should be disabled', async () => {
    const wrapper = shallowMount(InputField, {
      props: {
        readonly: true,
      },
    });
    expect(wrapper.find('input').attributes().disabled).toBeDefined();
  });
});
