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

  describe('focused field under the sticky footer', () => {
    let wrapper;

    const rect = (top, bottom) => ({
      top, bottom, left: 0, right: 0, x: 0, y: top, width: 0, height: bottom - top,
    });
    const nextFrame = () => new Promise((resolve) => { requestAnimationFrame(resolve); });

    function mountModal({
      props = { fromBottom: true },
      field = '<input class="field">',
      fieldBox = rect(400, 480),
      footerTop = 420,
      headerBottom = 32,
    } = {}) {
      wrapper = mount(Modal, {
        attachTo: document.body,
        props: { show: true, hasCloseButton: true, ...props },
        slots: {
          default: `<label class="input-wrapper">${field}</label>`,
          footer: '<button>OK</button>',
        },
        global: {
          plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
          stubs: {
            FixedScreenFooter: { template: '<div class="fixed-screen-footer"><slot /></div>' },
          },
        },
      });
      const container = wrapper.find('.container').element;
      const footer = wrapper.find('.fixed-screen-footer').element;
      Object.defineProperty(container, 'scrollTop', { value: 0, writable: true });
      vi.spyOn(wrapper.find('.header').element, 'getBoundingClientRect')
        .mockReturnValue(rect(0, headerBottom));
      vi.spyOn(wrapper.find('.input-wrapper').element, 'getBoundingClientRect')
        .mockReturnValue(fieldBox);
      const footerRect = vi.spyOn(footer, 'getBoundingClientRect')
        .mockReturnValue(rect(footerTop, 500));
      return { container, footerRect, field: wrapper.find('.field').element };
    }

    afterEach(() => {
      wrapper?.unmount();
      wrapper = undefined;
      vi.restoreAllMocks();
    });

    it.each([
      ['from-bottom', { fromBottom: true }],
      ['full-screen', { fullScreen: true }],
    ])('lifts the field above the footer after a resize (%s)', async (_, props) => {
      const { container, footerRect, field } = mountModal({ props, footerTop: 600 });
      field.focus();
      await nextFrame();
      expect(container.scrollTop).toBe(0);

      // The keyboard shrinks the view and the footer moves up.
      footerRect.mockReturnValue(rect(420, 500));
      window.dispatchEvent(new Event('resize'));
      await nextFrame();
      expect(container.scrollTop).toBe(60);
    });

    it('lifts a covered field when it gets focus', async () => {
      const { container, field } = mountModal();
      field.focus();
      await nextFrame();
      expect(container.scrollTop).toBe(60);
    });

    it('rounds a fractional lift up', async () => {
      const { container, field } = mountModal({ fieldBox: rect(400, 480.25) });
      field.focus();
      await nextFrame();
      expect(container.scrollTop).toBe(61);
    });

    it('keeps the field top below the header', async () => {
      const { container, field } = mountModal({ fieldBox: rect(100, 480), headerBottom: 80 });
      field.focus();
      await nextFrame();
      expect(container.scrollTop).toBe(20);
    });

    it('does not scroll when the field is above the footer', async () => {
      const { container, field } = mountModal({ footerTop: 480 });
      field.focus();
      window.dispatchEvent(new Event('resize'));
      await nextFrame();
      expect(container.scrollTop).toBe(0);
    });

    it('ignores non-text inputs', async () => {
      const { container, field } = mountModal({ field: '<input class="field" type="checkbox">' });
      field.focus();
      await nextFrame();
      expect(container.scrollTop).toBe(0);
    });

    it('ignores centered modals', async () => {
      const { container, field } = mountModal({ props: {} });
      field.focus();
      window.dispatchEvent(new Event('resize'));
      await nextFrame();
      expect(container.scrollTop).toBe(0);
    });

    it('stops listening to resize after unmount', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      mountModal();
      const handler = addSpy.mock.calls.find(([type]) => type === 'resize')[1];
      wrapper.unmount();
      wrapper = undefined;
      expect(removeSpy).toHaveBeenCalledWith('resize', handler);
    });
  });
});
