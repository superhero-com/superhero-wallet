import { shallowMount } from '@vue/test-utils';
import CheckBox from '../../src/popup/components/CheckBox.vue';

describe('Checkbox', () => {
  it('should render', async () => {
    const wrapper = shallowMount(CheckBox);
    expect(wrapper.find('.checkbox-container').exists()).toBeTruthy();
  });
  it('should emit function on change', async () => {
    const wrapper = shallowMount(CheckBox);
    await wrapper.find('input').trigger('change');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
  });
  [1, 'true', true].forEach((modelValue) => it(`should be checked with truthy value [${modelValue}]`, async () => {
    const wrapper = shallowMount(CheckBox, {
      props: {
        modelValue,
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.checkmark').classes()).toContain('checked');
  }));
  [false, '', null, undefined, 0].forEach((modelValue) => it(`should be unchecked with falsy value [${modelValue}]`, () => {
    const wrapper = shallowMount(CheckBox, {
      props: {
        modelValue,
      },
    });
    expect(wrapper.find('.checkmark').classes()).not.toContain('checked');
  }));
  it('should be disabled', async () => {
    const wrapper = shallowMount(CheckBox, {
      props: {
        disabled: true,
      },
    });
    expect(wrapper.find('.checkmark').classes()).toContain('disabled');
  });
});
