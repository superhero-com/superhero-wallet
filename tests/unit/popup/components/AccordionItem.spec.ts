import { enableAutoUnmount, mount } from '@vue/test-utils';
import AccordionItem from '@/popup/components/AccordionItem.vue';

enableAutoUnmount(afterEach);

describe('AccordionItem', () => {
  it('toggles its content from a button that reports the state', async () => {
    const wrapper = mount(AccordionItem, {
      props: { label: 'Section' },
      slots: { default: '<p>Body</p>' },
    });
    const label = wrapper.get('[data-cy=accordion-item-label]');

    expect(label.element.tagName).toBe('BUTTON');
    expect(label.attributes('type')).toBe('button');
    expect(label.attributes('aria-expanded')).toBe('false');
    expect(label.attributes('aria-controls')).toBeUndefined();

    await label.trigger('click');
    const content = wrapper.get('[data-cy=accordion-item-content]');
    expect(label.attributes('aria-expanded')).toBe('true');
    expect(label.attributes('aria-controls')).toBe(content.attributes('id'));
    expect(content.attributes('id')).toBeTruthy();

    await label.trigger('click');
    expect(label.attributes('aria-expanded')).toBe('false');
    expect(label.attributes('aria-controls')).toBeUndefined();
  });

  it('does not submit a surrounding form', async () => {
    const onSubmit = vi.fn((event: Event) => event.preventDefault());
    const wrapper = mount({
      components: { AccordionItem },
      template: '<form @submit="onSubmit"><AccordionItem label="Section">Body</AccordionItem></form>',
      setup: () => ({ onSubmit }),
    }, { attachTo: document.body });

    (wrapper.get('[data-cy=accordion-item-label]').element as HTMLButtonElement).click();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('gives each item its own content id', async () => {
    const wrapper = mount({
      components: { AccordionItem },
      template: '<div><AccordionItem label="A">A</AccordionItem><AccordionItem label="B">B</AccordionItem></div>',
    });
    await Promise.all(wrapper.findAll('[data-cy=accordion-item-label]').map((label) => label.trigger('click')));

    const ids = wrapper.findAll('[data-cy=accordion-item-content]').map((content) => content.attributes('id'));
    expect(new Set(ids).size).toBe(2);
  });
});
