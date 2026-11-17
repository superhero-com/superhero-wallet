import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { nextTick, ref, type Ref } from 'vue';
import { createI18n } from 'vue-i18n';
import en from '@/popup/locales/en-US.json';
import { PROTOCOLS } from '@/constants';
import type { IAddressBookEntry } from '@/types';
import FormAccountInput from '@/popup/components/form/FormAccountInput.vue';

const ALICE = 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR';
const ALICIA = 'ak_2swhLkgBPeeADxVTAVCJnZLY5NZtCFiM93JxsEaMuC59euuFRQ';

const mocks = vi.hoisted(() => ({
  addressBookFiltered: { value: [] as IAddressBookEntry[] },
  allAccounts: null as unknown as Ref<IAddressBookEntry[]>,
}));
const { addressBookFiltered } = mocks;

vi.mock('@/composables', async (importOriginal) => {
  const vue = await import('vue');
  mocks.allAccounts = vue.ref([]);
  return {
    ...(await importOriginal<typeof import('@/composables')>()),
    useAddressBook: () => ({ addressBookFiltered, protocolFilter: vue.ref(null) }),
    useNetworks: () => ({ activeNetwork: vue.ref({ type: 'mainnet' }) }),
    useAccountSelector: () => ({ allAccounts: mocks.allAccounts }),
  };
});

enableAutoUnmount(afterEach);

// Truncate measures itself; jsdom has no ResizeObserver
vi.stubGlobal('ResizeObserver', class {
  observe() {} // eslint-disable-line class-methods-use-this

  unobserve() {} // eslint-disable-line class-methods-use-this

  disconnect() {} // eslint-disable-line class-methods-use-this
});

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

beforeEach(() => {
  mocks.allAccounts.value = [];
  addressBookFiltered.value = [
    {
      name: 'Alice', address: ALICE, isBookmarked: false, protocol: PROTOCOLS.aeternity,
    },
    {
      name: 'Alicia', address: ALICIA, isBookmarked: false, protocol: PROTOCOLS.aeternity,
    },
  ];
});

async function mountWithOpenList(singleDefaultFormat = false) {
  const value = ref<string[]>([]);
  const wrapper = mount({
    components: { FormAccountInput },
    template: '<FormAccountInput v-model="value" :protocol="protocol" :single-default-format="single" />',
    setup: () => ({ value, protocol: PROTOCOLS.aeternity, single: singleDefaultFormat }),
  }, {
    attachTo: document.body,
    global: { plugins: [i18n], stubs: { Avatar: true } },
  });
  const field = wrapper.get('textarea');
  (field.element as HTMLTextAreaElement).focus();
  await field.setValue('Ali');
  await flushPromises();
  return { wrapper, value };
}

function press(element: Element, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', {
    key, bubbles: true, cancelable: true, ...init,
  });
  element.dispatchEvent(event);
  return event;
}

function clickOption(element: Element, detail: number) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
}

describe('FormAccountInput suggestions', () => {
  it('keeps the always-rendered options out of the tab order', async () => {
    const { wrapper } = await mountWithOpenList();
    const options = wrapper.findAll('[data-cy=address-suggestion]');

    expect(wrapper.get('.dropdown-wrapper').classes()).toContain('open');
    expect(options).toHaveLength(2);
    options.forEach((option) => {
      expect(option.element.tagName).toBe('BUTTON');
      expect(option.attributes('type')).toBe('button');
      expect(option.attributes('tabindex')).toBe('-1');
    });
  });

  it('does not pick a suggestion when the field box is clicked', async () => {
    const { wrapper, value } = await mountWithOpenList();

    (wrapper.get('[data-cy=input-wrapper]').element as HTMLElement).click();
    await flushPromises();

    expect(value.value).toEqual([]);
  });

  it('moves between the field and the options with the arrow keys', async () => {
    const { wrapper } = await mountWithOpenList();
    const field = wrapper.get('textarea').element;
    const [first, second] = wrapper.findAll('[data-cy=address-suggestion]').map((o) => o.element);

    expect(press(field, 'ArrowDown').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
    press(first, 'ArrowDown');
    expect(document.activeElement).toBe(second);
    press(second, 'ArrowDown');
    expect(document.activeElement).toBe(second);
    press(second, 'ArrowUp');
    expect(document.activeElement).toBe(first);
    press(first, 'ArrowUp');
    expect(document.activeElement).toBe(field);
  });

  it('ignores the arrow keys while text is being composed', async () => {
    const { wrapper } = await mountWithOpenList();
    const field = wrapper.get('textarea').element;

    press(field, 'ArrowDown', { isComposing: true });

    expect(document.activeElement).toBe(field);
  });

  it('adds a suggestion picked with the keyboard once and returns to the field', async () => {
    const { wrapper, value } = await mountWithOpenList();
    press(wrapper.get('textarea').element, 'ArrowDown');

    clickOption(document.activeElement!, 0);
    await flushPromises();

    expect(value.value).toEqual([ALICE]);
    expect(wrapper.get('.dropdown-wrapper').classes()).not.toContain('open');
    expect(document.activeElement).toBe(wrapper.get('textarea').element);
  });

  it('focuses the clear button when the picked recipient replaces the field', async () => {
    const { wrapper, value } = await mountWithOpenList(true);
    press(wrapper.get('textarea').element, 'ArrowDown');

    clickOption(document.activeElement!, 0);
    await flushPromises();
    await nextTick();

    expect(value.value).toEqual([ALICE]);
    expect(wrapper.find('textarea').exists()).toBe(false);
    expect((document.activeElement as HTMLElement).dataset.cy).toBe('clear-address-button');
  });

  it('leaves nothing focused when a pointer pick replaces the field', async () => {
    const { wrapper, value } = await mountWithOpenList(true);
    const [first] = wrapper.findAll('[data-cy=address-suggestion]').map((o) => o.element);

    clickOption(first, 1);
    await flushPromises();
    await nextTick();

    expect(value.value).toEqual([ALICE]);
    expect(wrapper.find('textarea').exists()).toBe(false);
    expect(document.activeElement).toBe(document.body);
  });

  it('stops a press on a suggestion from moving the focus', async () => {
    const { wrapper } = await mountWithOpenList();
    const [first] = wrapper.findAll('[data-cy=address-suggestion]').map((o) => o.element);
    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });

    first.dispatchEvent(mousedown);

    // The default action would move the focus, and the field's blur shows its error
    expect(mousedown.defaultPrevented).toBe(true);
  });

  it('leaves the field empty and unfocused after a pointer pick', async () => {
    const { wrapper, value } = await mountWithOpenList();
    const field = wrapper.get('textarea').element as HTMLTextAreaElement;
    const [first] = wrapper.findAll('[data-cy=address-suggestion]').map((o) => o.element);

    clickOption(first, 1);
    await flushPromises();

    expect(value.value).toEqual([ALICE]);
    expect(field.value).toBe('');
    expect(document.activeElement).toBe(document.body);
  });

  it('leaves focus off the list after a pointer pick, without refocusing the field', async () => {
    const { wrapper, value } = await mountWithOpenList();
    const [first] = wrapper.findAll('[data-cy=address-suggestion]').map((o) => o.element);
    (first as HTMLElement).focus();

    clickOption(first, 1);
    await flushPromises();

    expect(value.value).toEqual([ALICE]);
    expect(document.activeElement).toBe(document.body);
  });

  it('closes the list with Escape without letting a modal close too', async () => {
    const { wrapper } = await mountWithOpenList();
    const field = wrapper.get('textarea').element;
    press(field, 'ArrowDown');

    expect(press(document.activeElement!, 'Escape').defaultPrevented).toBe(true);
    await nextTick();
    expect(document.activeElement).toBe(field);
    expect(wrapper.get('.dropdown-wrapper').classes()).not.toContain('open');

    // With the list closed, Escape is left to the modal
    expect(press(field, 'Escape').defaultPrevented).toBe(false);
  });

  it('closes the list with Escape from the field', async () => {
    const { wrapper } = await mountWithOpenList();

    expect(press(wrapper.get('textarea').element, 'Escape').defaultPrevented).toBe(true);
    await nextTick();

    expect(wrapper.get('.dropdown-wrapper').classes()).not.toContain('open');
  });
});

describe('FormAccountInput typed text', () => {
  it('keeps a half-typed recipient when the account list refreshes', async () => {
    const { wrapper } = await mountWithOpenList();

    mocks.allAccounts.value = [...addressBookFiltered.value];
    await flushPromises();

    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('Ali');
  });

  it('keeps a half-typed vault signer when the account list refreshes', async () => {
    const signer = ref<string>();
    // Bound as in MultisigVaultCreate. The placeholder makes the parent update it on a refresh.
    const wrapper = mount({
      components: { FormAccountInput },
      template: `
        <FormAccountInput
          :model-value="signer ? [signer] : undefined"
          :placeholder="String(accounts.length)"
          :protocol="protocol"
          single-default-format
          @update:model-value="signer = $event[0]"
        />
      `,
      setup: () => ({ signer, accounts: mocks.allAccounts, protocol: PROTOCOLS.aeternity }),
    }, {
      attachTo: document.body,
      global: { plugins: [i18n], stubs: { Avatar: true } },
    });
    await wrapper.get('textarea').setValue('Ali');

    mocks.allAccounts.value = [...addressBookFiltered.value];
    await flushPromises();

    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('Ali');
  });

  it('clears the typed text when the recipients are reset', async () => {
    const { wrapper, value } = await mountWithOpenList();

    value.value = [];
    await flushPromises();

    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('');
  });
});
