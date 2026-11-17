import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import Modal from '../../../../src/popup/components/Modal.vue';
import en from '../../../../src/popup/locales/en-US.json';

describe('Modal', () => {
  it('should close on button close click', async () => {
    const wrapper = mount(Modal, {
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
      },
      props: {
        show: true,
        hasCloseButton: true,
      },
    });
    await wrapper.find('[data-cy=btn-close]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('should have "full-screen" variant', async () => {
    const wrapper = mount(Modal, {
      global: {
        mocks: {
          $t: () => 'locale-specific-text',
          $store: {
            state: {},
          },
        },
      },
      props: {
        show: true,
        fullScreen: true,
      },
    });
    expect(wrapper.find('.full-screen').exists()).toBeTruthy();
  });

  it('should have "from-bottom" variant', async () => {
    const wrapper = mount(Modal, {
      props: {
        show: true,
        fromBottom: true,
      },
    });
    expect(wrapper.find('.from-bottom').exists()).toBeTruthy();
  });

  [
    { slot: 'header', className: '.header' },
    { slot: 'default', className: '.body' },
    { slot: 'footer', className: '.fixed-screen-footer' },
  ].forEach(({ slot, className }) => it(`should have ${slot} slot`, async () => {
    const slotText = `${slot} test`;
    const wrapper = mount(Modal, {
      props: { show: true },
      slots: { [slot]: slotText },
      global: {
        mocks: {
          $t: () => 'locale-specific-text',
          $store: { state: {} },
        },
      },
    });

    expect(wrapper.find(className).text()).toContain(slotText);
  }));
});
