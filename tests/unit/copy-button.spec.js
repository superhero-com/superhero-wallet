import { mount } from '@vue/test-utils';
import Vue from 'vue';
import VueClipboard from 'vue-clipboard2';
import CopyButton from '../../src/popup/router/components/CopyButton.vue';

Vue.use(VueClipboard);

describe('CopyButton', () => {
  it('should change message on copy success', async () => {
    const wrapper = mount(CopyButton, {
      propsData: {
        value: 'test value',
        message: 'copied',
      },
    });
    await wrapper.trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.message').text()).toContain('copied');
  });
});
