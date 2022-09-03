import { shallowMount } from '@vue/test-utils';
import Textarea from '../../src/popup/router/components/FormTextarea.vue';

describe('Textarea', () => {
  it('should render', async () => {
    const wrapper = shallowMount(Textarea);
    expect(wrapper.find('[data-cy=textarea]').exists()).toBeTruthy();
  });
  it('should emit string value on input', async () => {
    const testString = 'test string\n test string';
    const wrapper = shallowMount(Textarea);
    await wrapper.find('[data-cy=textarea]').setValue(testString);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('input')).toBeTruthy();
    expect(wrapper.emitted('input')[0]).toEqual([testString]);
  });
  it('should have the placeholder', async () => {
    const wrapper = shallowMount(Textarea, {
      propsData: {
        placeholder: 'test placeholder',
      },
    });
    expect(wrapper.find('[data-cy=textarea]').attributes().placeholder).toBeDefined();
  });
  it('should have error class', async () => {
    const wrapper = shallowMount(Textarea, {
      propsData: {
        error: true,
      },
    });
    expect(wrapper.find('[data-cy=textarea]').classes()).toContain('error');
  });
  it('should have size class', async () => {
    const size = 'sm';
    const wrapper = shallowMount(Textarea, {
      propsData: {
        size,
      },
    });
    expect(wrapper.find('[data-cy=textarea]').classes()).toContain(size);
  });
});
