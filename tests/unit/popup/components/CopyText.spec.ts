import { enableAutoUnmount, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import en from '@/popup/locales/en-US.json';
import CopyText from '@/popup/components/CopyText.vue';

const { copy } = vi.hoisted(() => ({ copy: vi.fn() }));

vi.mock('@/composables', async (importOriginal) => {
  const vue = await import('vue');
  return {
    ...(await importOriginal<typeof import('@/composables')>()),
    useCopy: () => ({ copy, copied: vue.ref(false) }),
  };
});

enableAutoUnmount(afterEach);

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

function mountCopyText(attrs: Record<string, unknown> = {}, slot = 'ak_2…xyz') {
  const onClick = vi.fn();
  const wrapper = mount({
    components: { CopyText },
    template: `<CopyText v-bind="attrs" ${attrs.withHandler ? '@click="onClick"' : ''}>${slot}</CopyText>`,
    setup: () => ({ attrs: { value: 'ak_value', ...attrs, withHandler: undefined }, onClick }),
  }, { attachTo: document.body, global: { plugins: [i18n] } });
  return { wrapper, root: wrapper.get('.copy-text').element as HTMLElement, onClick };
}

function press(element: Element, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', {
    key, bubbles: true, cancelable: true, ...init,
  });
  element.dispatchEvent(event);
  return event;
}

describe('CopyText', () => {
  beforeEach(() => {
    copy.mockClear();
  });

  it('copies once per Enter or Space', () => {
    const { root } = mountCopyText();

    expect(root.getAttribute('role')).toBe('button');
    expect(root.getAttribute('tabindex')).toBe('0');
    expect(press(root, 'Enter').defaultPrevented).toBe(true);
    expect(copy).toHaveBeenCalledTimes(1);
    expect(press(root, ' ').defaultPrevented).toBe(true);
    expect(copy).toHaveBeenCalledTimes(2);
    expect(copy).toHaveBeenLastCalledWith('ak_value');
  });

  it('ignores other keys and a held key', () => {
    const { root } = mountCopyText();

    press(root, 'a');
    press(root, 'Enter', { repeat: true });

    expect(copy).not.toHaveBeenCalled();
  });

  it('leaves keys pressed on a link inside to that link', () => {
    const { wrapper } = mountCopyText({}, '<a class="inner" href="https://example.com">link</a>');

    press(wrapper.get('.inner').element, 'Enter');

    expect(copy).not.toHaveBeenCalled();
  });

  it('runs the caller click handler once per key, like a click', () => {
    const { root, onClick } = mountCopyText({ withHandler: true });

    press(root, 'Enter');
    root.click();

    expect(onClick).toHaveBeenCalledTimes(2);
    expect(copy).toHaveBeenCalledTimes(2);
  });

  it('acts through the caller handler alone when copying is disabled', () => {
    const { root, onClick } = mountCopyText({ disabled: true, withHandler: true });

    expect(root.getAttribute('role')).toBe('button');
    press(root, 'Enter');

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(copy).not.toHaveBeenCalled();
  });

  it('is plain text when disabled without a handler', () => {
    const { root } = mountCopyText({ disabled: true });

    expect(root.hasAttribute('role')).toBe(false);
    expect(root.hasAttribute('tabindex')).toBe(false);
    root.click();
    expect(copy).not.toHaveBeenCalled();
  });
});
