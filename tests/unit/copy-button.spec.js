import { mount } from '@vue/test-utils';
import Vue from 'vue';
import VueClipboard from 'vue-clipboard2';
import BtnCopy from '../../src/popup/router/components/buttons/BtnCopy.vue';

Vue.use(VueClipboard);

describe('BtnCopy', () => {
  it('should change message on copy success', async () => {
    const wrapper = mount(BtnCopy, {
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
