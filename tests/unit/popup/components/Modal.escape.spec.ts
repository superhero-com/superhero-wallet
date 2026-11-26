import { enableAutoUnmount, mount } from '@vue/test-utils';
import { nextTick, onMounted, ref } from 'vue';
import { createI18n } from 'vue-i18n';
import en from '@/popup/locales/en-US.json';
import Modal from '@/popup/components/Modal.vue';
import Default from '@/popup/components/Modals/Default.vue';
import { accessibleName } from '../../helpers/accessibleName';

const env = vi.hoisted(() => ({ isMobileDevice: false }));

vi.mock('@/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/constants')>()),
  get IS_MOBILE_DEVICE() {
    return env.isMobileDevice;
  },
}));

enableAutoUnmount(afterEach);

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

function mountModal(props: Record<string, unknown> = {}, content = '<input class="field">') {
  return mount(Modal, {
    attachTo: document.body,
    props: { show: true, hasCloseButton: true, ...props },
    slots: { default: content },
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

describe('Modal focus', () => {
  function addToPage(tag = 'button') {
    const element = document.createElement(tag);
    element.textContent = 'Open';
    document.body.append(element);
    return element;
  }

  afterEach(() => {
    env.isMobileDevice = false;
    document.querySelectorAll('body > button, body > input').forEach((element) => element.remove());
  });

  it.each([
    ['its header', () => mountModal({ header: 'Send' })],
    ['the title of its content', () => mountModal({}, '<h2>Send</h2>')],
    ['the title of the default modal, not its subtitle', () => mount(Default, {
      attachTo: document.body,
      props: { resolve: vi.fn(), title: 'Send', subtitle: 'Fees apply' },
      attrs: { show: true },
      global: { plugins: [i18n] },
    })],
  ])('is a modal dialog named by %s', async (_, mountDialog) => {
    const dialog = mountDialog().get('[role=dialog]').element;
    await nextTick();

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(accessibleName(dialog)).toBe('Send');
  });

  it('moves the focus inside when it opens', () => {
    addToPage().focus();

    const wrapper = mountModal();

    expect(document.activeElement).toBe(wrapper.get('.container').element);
  });

  it('keeps a field the content focused', () => {
    const wrapper = mount(Modal, {
      attachTo: document.body,
      props: { show: true },
      slots: {
        default: {
          template: '<input ref="field" class="field">',
          setup() {
            const field = ref<HTMLInputElement>();
            onMounted(() => field.value!.focus());
            return { field };
          },
        },
      },
      global: { plugins: [i18n] },
    });

    expect(document.activeElement).toBe(wrapper.get('.field').element);
  });

  it('stops being focusable once the focus moves on', async () => {
    const wrapper = mountModal();
    const dialog = wrapper.get('.container');
    expect(dialog.attributes('tabindex')).toBe('-1');

    (wrapper.get('.field').element as HTMLElement).focus();
    await nextTick();

    // A tap inside would focus it, closing the iOS keyboard
    expect(dialog.attributes('tabindex')).toBeUndefined();
  });

  it('returns the focus to the opener when Escape closes it', async () => {
    const opener = addToPage();
    opener.focus();
    const wrapper = mountModal();

    pressEscape({}, wrapper.get('.field').element);
    expect(wrapper.emitted('close')).toHaveLength(1);
    await wrapper.setProps({ show: false });

    expect(document.activeElement).toBe(opener);
  });

  it('returns the focus when it unmounts while shown', () => {
    const opener = addToPage();
    opener.focus();
    const wrapper = mountModal();

    wrapper.unmount();

    expect(document.activeElement).toBe(opener);
  });

  it('returns the focus after the focused control inside was removed', async () => {
    const opener = addToPage();
    opener.focus();
    const wrapper = mountModal();
    const field = wrapper.get('.field').element as HTMLElement;
    field.focus();

    // As on a step change: the focus falls back to the body
    field.remove();
    await wrapper.setProps({ show: false });

    expect(document.activeElement).toBe(opener);
  });

  it('returns the focus into the modal below when the top one closes', async () => {
    const lower = mountModal({}, '<button class="action">Next</button>');
    const action = lower.get('.action').element as HTMLElement;
    action.focus();
    const upper = mountModal();

    await upper.setProps({ show: false });

    expect(document.activeElement).toBe(action);
  });

  it('leaves the focus the user moved elsewhere', async () => {
    addToPage().focus();
    const wrapper = mountModal();
    const other = addToPage();
    other.focus();

    await wrapper.setProps({ show: false });

    expect(document.activeElement).toBe(other);
  });

  it.each([
    ['refocuses a text field on a desktop', false, true],
    ['does not refocus a text field on a phone, which would raise its keyboard', true, false],
  ])('%s', async (_, isMobileDevice, isRefocused) => {
    env.isMobileDevice = isMobileDevice;
    const opener = addToPage('input');
    opener.focus();
    const wrapper = mountModal();

    await wrapper.setProps({ show: false });

    expect(document.activeElement === opener).toBe(isRefocused);
  });
});
