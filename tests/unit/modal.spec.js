import { mount, shallowMount } from '@vue/test-utils';
import Modal from '../../src/popup/router/components/Modal.vue';

describe('Modal', () => {
  it('should close on button close click', async () => {
    const wrapper = mount(Modal, {
      propsData: {
        close: true,
      },
    });
    await wrapper.find('.close').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')).toBeTruthy();
  });
  it('should have "full-screen" class', async () => {
    const wrapper = mount(Modal, {
      propsData: {
        fullScreen: true,
      },
    });
    expect(wrapper.find('.full-screen').exists()).toBeTruthy();
  });
  [{
    slot: 'header',
    className: '.header',
  }, {
    slot: 'default',
    className: '.body',
  },
  {
    slot: 'footer',
    className: '.footer',
  }].forEach(({ slot, className }) => it(`should have ${slot} slot`, async () => {
    const slotText = `${slot} test`;
    const wrapper = shallowMount(Modal, {
      slots: {
        [slot]: slotText,
      },
    });

    expect(wrapper.find(className).text()).toContain(slotText);
  }));
});
