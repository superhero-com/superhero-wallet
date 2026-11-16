// @ts-nocheck
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import en from '@/popup/locales/en-US.json';
import FormSelectOptionsItem from '@/popup/components/FormSelectOptionsItem.vue';
import InputPassword from '@/popup/components/InputPassword.vue';
import InputSearch from '@/popup/components/InputSearch.vue';

/**
 * These components re-emit an event of their root. Left undeclared, the parent's listener
 * also falls through to the root, so it ran twice.
 */
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

describe('re-emitted events', () => {
  it.each([
    ['InputSearch', InputSearch, {}],
    ['InputPassword', InputPassword, { modelValue: '' }],
  ])('%s updates the model once per input', async (_, component, props) => {
    const onUpdate = vi.fn();
    const wrapper = mount(component, {
      props: { ...props, 'onUpdate:modelValue': onUpdate },
      global: { plugins: [i18n] },
    });

    await wrapper.find('input').setValue('abc');

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith('abc');
  });

  it('FormSelectOptionsItem reports a click once', async () => {
    const onClick = vi.fn();
    const wrapper = mount(FormSelectOptionsItem, {
      props: { option: { value: 'a', text: 'A' }, onClick },
      global: { plugins: [i18n] },
    });

    await wrapper.trigger('click');

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
