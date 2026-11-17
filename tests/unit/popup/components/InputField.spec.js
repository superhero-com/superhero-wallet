import { mount, shallowMount } from '@vue/test-utils';
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

  it('passes a click on the field box to the input', async () => {
    const wrapper = mount(InputField, { attachTo: document.body, props: { label: 'Name' } });
    const input = wrapper.get('input');
    const onInputClick = vi.fn();
    input.element.addEventListener('click', onInputClick);

    expect(wrapper.get('[data-cy=input-wrapper]').attributes('for')).toBe(input.attributes('id'));
    wrapper.get('[data-cy=input-wrapper]').element.click();

    expect(onInputClick).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('does not press a button inside the field when a slot replaces the input', async () => {
    const onClear = vi.fn();
    const wrapper = mount({
      components: { InputField },
      template: `
        <InputField label="Recipient">
          <span class="value">ak_2…xyz</span>
          <template #after><button type="button" class="clear" @click="onClear">x</button></template>
        </InputField>
      `,
      setup: () => ({ onClear }),
    }, { attachTo: document.body });

    wrapper.get('[data-cy=input-wrapper]').element.click();
    wrapper.get('.value').element.click();
    wrapper.get('.text-label').element.click();
    expect(onClear).not.toHaveBeenCalled();

    wrapper.get('.clear').element.click();
    expect(onClear).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });
});
