// @ts-nocheck
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import en from '@/popup/locales/en-US.json';

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

vi.mock('@/protocols/aeternity/composables/aeNames', () => ({
  useAeNames: () => ({ getName: () => ref('') }),
}));
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => ({ push: vi.fn() }),
}));

describe('NotificationItem', () => {
  it('opens an external link without access to the wallet window', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const { default: NotificationItem } = await import('@/popup/components/NotificationItem.vue');
    const wrapper = mount(NotificationItem, {
      props: {
        notification: {
          type: 'wallet',
          title: 'News',
          text: 'Read more',
          status: 'CREATED',
          createdAt: '2026-10-01T00:00:00.000Z',
          path: 'https://example.com/news',
        },
      },
      global: { plugins: [i18n], stubs: { Avatar: true, BtnMain: true, Truncate: true } },
    });

    await wrapper.trigger('click');

    expect(open).toHaveBeenCalledWith('https://example.com/news', '_blank', 'noopener,noreferrer');
  });
});
