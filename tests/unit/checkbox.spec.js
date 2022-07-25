import { shallowMount } from '@vue/test-utils';
import CheckBox from '../../src/popup/router/components/CheckBox.vue';

describe('Checkbox', () => {
  it('should render', async () => {
    const wrapper = shallowMount(CheckBox);
    expect(wrapper.find('.checkbox-container').exists()).toBeTruthy();
  });
  it('should emit function on click', async () => {
    const wrapper = shallowMount(CheckBox);
    await wrapper.find('input').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('input')).toBeTruthy();
  });
  [1, 'true', true].forEach((value) => it(`should be checked with truthy value [${value}]`, async () => {
    const wrapper = shallowMount(CheckBox, {
      propsData: {
        value,
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.checkmark').classes()).toContain('checked');
  }));
  [false, '', null, undefined, 0].forEach((value) => it(`should be unchecked with falsey value [${value}]`, () => {
    const wrapper = shallowMount(CheckBox, {
      propsData: {
        value,
      },
    });
    expect(wrapper.find('.checkmark').classes()).not.toContain('checked');
  }));
  it('should be disabled', async () => {
    const wrapper = shallowMount(CheckBox, {
      propsData: {
        disabled: true,
      },
    });
    expect(wrapper.find('.checkmark').classes()).toContain('disabled');
  });
});
