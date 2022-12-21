import Vue from 'vue';
import { mount } from '@vue/test-utils';
import Modal from '../../src/popup/components/Modal.vue';

Object.assign(Vue.prototype, {
  $t: () => 'locale-specific-text',
});

describe('Modal', () => {
  it('should close on button close click', async () => {
    const wrapper = mount(Modal, {
      propsData: {
        hasCloseButton: true,
      },
    });
    await wrapper.find('[data-cy=btn-close]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('should have "full-screen" variant', async () => {
    const wrapper = mount(Modal, {
      mocks: {
        $store: {
          state: {},
        },
      },
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
      className: '.fixed-screen-footer',
    },
  ].forEach(({ slot, className }) => it(`should have ${slot} slot`, async () => {
    const slotText = `${slot} test`;
    const wrapper = mount(Modal, {
      slots: {
        [slot]: slotText,
      },
    });

    expect(wrapper.find(className).text()).toContain(slotText);
  }));
});
