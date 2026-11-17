import { enableAutoUnmount, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import en from '@/popup/locales/en-US.json';
import Modal from '@/popup/components/Modal.vue';

enableAutoUnmount(afterEach);

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

function mountModal(props: Record<string, unknown> = {}) {
  return mount(Modal, {
    attachTo: document.body,
    props: { show: true, hasCloseButton: true, ...props },
    slots: { default: '<input class="field">' },
    global: { plugins: [i18n] },
  });
}

function pressEscape(init: KeyboardEventInit = {}, target: EventTarget = document.body) {
  const event = new KeyboardEvent('keydown', {
    key: 'Escape', bubbles: true, cancelable: true, ...init,
  });
  target.dispatchEvent(event);
  return event;
}

describe('Modal Escape key', () => {
  it('closes the modal once', () => {
    const wrapper = mountModal();

    expect(pressEscape().defaultPrevented).toBe(true);

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('closes from a field inside the modal', () => {
    const wrapper = mountModal();

    pressEscape({}, wrapper.get('.field').element);

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('closes only the modal opened last', async () => {
    const lower = mountModal();
    const upper = mountModal();

    pressEscape();
    expect(upper.emitted('close')).toHaveLength(1);
    expect(lower.emitted('close')).toBeUndefined();

    // The closed modal stays mounted for its leave transition
    await upper.setProps({ show: false });
    pressEscape();
    expect(upper.emitted('close')).toHaveLength(1);
    expect(lower.emitted('close')).toHaveLength(1);
  });

  it('passes to the modal below once the top one unmounts', () => {
    const lower = mountModal();
    const upper = mountModal();

    upper.unmount();
    pressEscape();

    expect(lower.emitted('close')).toHaveLength(1);
  });

  it('closes a modal without a close button when its backdrop is visible', () => {
    const wrapper = mountModal({ hasCloseButton: false, fromBottom: true });

    pressEscape();

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('keeps a full-screen modal without a close button open', () => {
    const lower = mountModal();
    const upper = mountModal({ hasCloseButton: false, fullScreen: true });

    expect(pressEscape().defaultPrevented).toBe(false);

    expect(upper.emitted('close')).toBeUndefined();
    expect(lower.emitted('close')).toBeUndefined();
  });

  it.each([
    ['handled by a control inside', { cancelable: true }, true],
    ['part of text composition', { isComposing: true }, false],
    ['held down', { repeat: true }, false],
  ])('ignores Escape %s', (_, init, preventFirst) => {
    const wrapper = mountModal();
    const field = wrapper.get('.field').element;
    if (preventFirst) {
      field.addEventListener('keydown', (event) => event.preventDefault(), { once: true });
    }

    pressEscape(init, field);

    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('ignores other keys', () => {
    const wrapper = mountModal();

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('hides the backdrop from assistive technology', () => {
    const wrapper = mountModal();

    expect(wrapper.get('.cover').attributes('aria-hidden')).toBe('true');
  });
});
