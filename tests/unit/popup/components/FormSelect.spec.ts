import { enableAutoUnmount, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import en from '@/popup/locales/en-US.json';
import FormSelect from '@/popup/components/form/FormSelect.vue';
import { accessibleName } from '../../helpers/accessibleName';

const { openModal } = vi.hoisted(() => ({
  // Stays pending, like a modal the user has not closed yet
  openModal: vi.fn(() => new Promise(() => {})),
}));

vi.mock('@/composables', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/composables')>()),
  useModals: () => ({ openModal }),
}));

enableAutoUnmount(afterEach);

function mountSelect(props = {}) {
  return mount(FormSelect, {
    attachTo: document.body,
    props: {
      defaultText: 'Select account',
      options: [],
      ...props,
    },
    attrs: { label: 'Signer 1' },
    global: { plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })] },
  });
}

describe('FormSelect', () => {
  beforeEach(() => {
    openModal.mockClear();
  });

  it('renders the styled field as a button the labels point to', () => {
    const wrapper = mountSelect();
    const button = wrapper.get('button.input-field-text-wrapper');

    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('id')).toBeTruthy();
    expect(wrapper.get('.text-label').attributes('for')).toBe(button.attributes('id'));
    expect(wrapper.get('[data-cy=input-wrapper]').attributes('for')).toBe(button.attributes('id'));
    expect(accessibleName(button.element)).toBe('Signer 1 Select account');
  });

  it.each([
    ['the button', 'button.input-field-text-wrapper'],
    ['the field label', '.text-label'],
    ['the field padding', '[data-cy=input-wrapper]'],
    ['the arrow', '.arrow-icon'],
  ])('opens the options once per click on %s', (_, selector) => {
    const wrapper = mountSelect();

    (wrapper.get(selector).element as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );

    expect(openModal).toHaveBeenCalledTimes(1);
  });

  it('cannot be opened when read-only', () => {
    const wrapper = mountSelect({ readonly: true });
    const button = wrapper.get('button.input-field-text-wrapper');

    expect(button.attributes('disabled')).toBeDefined();
    (button.element as HTMLButtonElement).click();

    expect(openModal).not.toHaveBeenCalled();
  });

  it('renders the pill look as a single button that opens the options', () => {
    const wrapper = mountSelect({ pill: true });
    const buttons = wrapper.findAll('button');

    expect(buttons).toHaveLength(1);
    expect(buttons[0].classes()).toContain('btn-pill');
    (buttons[0].element as HTMLButtonElement).click();

    expect(openModal).toHaveBeenCalledTimes(1);
  });
});
