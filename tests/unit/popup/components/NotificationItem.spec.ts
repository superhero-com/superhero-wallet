// @ts-nocheck
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import en from '@/popup/locales/en-US.json';

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('@/protocols/aeternity/composables/aeNames', () => ({
  useAeNames: () => ({ getName: () => ref('') }),
}));
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => ({ push }),
}));

enableAutoUnmount(afterEach);

async function mountItem(notification, stubs = { BtnMain: true }) {
  const { default: NotificationItem } = await import('@/popup/components/NotificationItem.vue');
  return mount(NotificationItem, {
    attachTo: document.body,
    props: {
      notification: {
        status: 'CREATED',
        createdAt: '2026-10-01T00:00:00.000Z',
        ...notification,
      },
    },
    global: { plugins: [i18n], stubs: { Avatar: true, Truncate: true, ...stubs } },
  });
}

describe('NotificationItem', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('opens an external link without access to the wallet window', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const wrapper = await mountItem({
      type: 'wallet',
      title: 'News',
      text: 'Read more',
      buttonLabel: 'Go to store',
      path: 'https://example.com/news',
    });

    await wrapper.trigger('click');

    expect(open).toHaveBeenCalledWith('https://example.com/news', '_blank', 'noopener,noreferrer');
    open.mockRestore();
  });

  it('opens the link once from its button', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const wrapper = await mountItem({
      type: 'wallet',
      title: 'News',
      text: 'Read more',
      buttonLabel: 'Go to store',
      path: 'https://example.com/news',
    });
    const button = wrapper.get('.external-link-button');

    expect(button.element.tagName).toBe('BUTTON');
    expect(button.attributes('type')).toBe('button');
    (button.element as HTMLButtonElement).click();

    expect(open).toHaveBeenCalledTimes(1);
    open.mockRestore();
  });

  it('opens the seed phrase backup once from its button', async () => {
    const wrapper = await mountItem({
      type: 'wallet',
      title: 'Secure your account',
      text: 'Back up your seed phrase',
      buttonLabel: 'Back up now',
      path: '/more/settings/seed-phrase',
      isSeedBackup: true,
    }, {});
    const button = wrapper.get('.redirect-button');

    expect(button.element.tagName).toBe('BUTTON');
    (button.element as HTMLButtonElement).click();

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith('/more/settings/seed-phrase');
  });

  it('has nothing to press without a destination', async () => {
    const wrapper = await mountItem({
      type: 'wallet',
      title: 'Restore incomplete',
      text: 'Some accounts were not restored',
    });

    expect(wrapper.find('button').exists()).toBe(false);
    await wrapper.trigger('click');
    expect(push).not.toHaveBeenCalled();
  });
});
