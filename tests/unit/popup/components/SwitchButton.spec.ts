import { mount } from '@vue/test-utils';
import SwitchButton from '@/popup/components/SwitchButton.vue';

describe('SwitchButton', () => {
  it('stays on the value it is given until that changes', async () => {
    const wrapper = mount(SwitchButton, { props: { modelValue: true } });
    const input = wrapper.find('input');

    await input.setValue(false);

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
    // E.g. the change waits for a prompt, or was dismissed there
    expect(input.element.checked).toBe(true);

    await wrapper.setProps({ modelValue: false });
    expect(input.element.checked).toBe(false);
  });
});
