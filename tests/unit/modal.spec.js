import { mount, shallowMount } from '@vue/test-utils';
import Modal from '../../src/popup/router/components/Modal.vue';

describe('Modal', () => {
  it('should close on button close click', async () => {
    const wrapper = mount(Modal, {
      propsData: {
        hasCloseButton: true,
      },
    });
    await wrapper.find('.close-button').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('should have "full-screen" variant', async () => {
    const wrapper = mount(Modal, {
      propsData: {
        fullScreen: true,
      },
    });
    expect(wrapper.find('.full-screen').exists()).toBeTruthy();
  });

  it('should have "from-bottom" variant', async () => {
    const wrapper = mount(Modal, {
      propsData: {
        fromBottom: true,
      },
    });
    expect(wrapper.find('.from-bottom').exists()).toBeTruthy();
  });

  [
    {
      slot: 'header',
      className: '.header',
    },
    {
      slot: 'default',
      className: '.body',
    },
    {
      slot: 'footer',
      className: '.footer',
    },
  ].forEach(({ slot, className }) => it(`should have ${slot} slot`, async () => {
    const slotText = `${slot} test`;
    const wrapper = shallowMount(Modal, {
      slots: {
        [slot]: slotText,
      },
    });

    expect(wrapper.find(className).text()).toContain(slotText);
  }));
});
