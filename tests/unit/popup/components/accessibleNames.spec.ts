import axe from 'axe-core';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';

import BtnClose from '@/popup/components/buttons/BtnClose.vue';
import BtnHelp from '@/popup/components/buttons/BtnHelp.vue';
import BulletSwitcher from '@/popup/components/BulletSwitcher.vue';
import InputSelectAsset from '@/popup/components/InputSelectAsset.vue';
import NotificationsIcon from '@/popup/components/NotificationsIcon.vue';
import en from '@/popup/locales/en-US.json';
import zh from '@/popup/locales/zh-CN.json';
import type { IAsset } from '@/types';
import { accessibleName } from '../../helpers/accessibleName';

const notificationsNew = ref<object[]>([]);

vi.mock('@/composables', () => ({
  useModals: () => ({ openModal: vi.fn() }),
}));
vi.mock('@/composables/notifications', () => ({
  useNotifications: () => ({ notificationsNew }),
}));

enableAutoUnmount(afterEach);

function createTranslations(locale = 'en-US') {
  return createI18n({
    legacy: false,
    locale,
    messages: { 'en-US': en, 'zh-CN': zh },
  });
}

describe('button accessible names', () => {
  it.each([
    ['en-US', 'Close'],
    ['zh-CN', '关闭'],
  ])('localizes the shared close button in %s', (locale, expectedName) => {
    const wrapper = mount(BtnClose, {
      attachTo: document.body,
      global: { plugins: [createTranslations(locale)] },
    });

    expect(accessibleName(wrapper.get('button').element)).toBe(expectedName);
  });

  it('lets callers describe what a close button dismisses', () => {
    const wrapper = mount(BtnClose, {
      attachTo: document.body,
      attrs: { 'aria-label': 'Close QR scanner' },
      global: { plugins: [createTranslations()] },
    });

    expect(accessibleName(wrapper.get('button').element)).toBe('Close QR scanner');
  });

  it('names help buttons with their topic and allows a caller override', async () => {
    const wrapper = mount(BtnHelp, {
      attachTo: document.body,
      global: { plugins: [createTranslations()] },
    });

    expect(accessibleName(wrapper.get('button').element)).toBe('Help');
    await wrapper.setProps({ title: 'Network fees' });
    expect(accessibleName(wrapper.get('button').element)).toBe('Help: Network fees');
    const contextualHelp = mount(BtnHelp, {
      attachTo: document.body,
      props: { title: 'Network fees' },
      attrs: { 'aria-label': 'Explain transaction fees' },
      global: { plugins: [createTranslations()] },
    });
    expect(accessibleName(contextualHelp.get('button').element)).toBe('Explain transaction fees');
  });

  it.each([
    { locale: 'en-US', emptyName: 'Notifications', unreadPrefix: 'Notifications, unread: ' },
    { locale: 'zh-CN', emptyName: '通知', unreadPrefix: '通知，未读：' },
  ])('preserves the unread badge count in the $locale link name', async ({ locale, emptyName, unreadPrefix }) => {
    notificationsNew.value = [];
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/notifications', name: 'notifications', component: { template: '<div />' } },
      ],
    });
    await router.push('/');
    const wrapper = mount(NotificationsIcon, {
      attachTo: document.body,
      global: { plugins: [router, createTranslations(locale)] },
    });

    expect(wrapper.find('.badge-inner').exists()).toBe(false);
    expect(accessibleName(wrapper.get('a').element)).toBe(emptyName);

    async function expectUnreadCount(count: number, badge: string) {
      notificationsNew.value = Array.from({ length: count }, () => ({}));
      await nextTick();

      expect(wrapper.get('.badge-inner').text()).toBe(badge);
      expect(accessibleName(wrapper.get('a').element)).toBe(`${unreadPrefix}${badge}`);
    }

    await expectUnreadCount(1, '1');
    await expectUnreadCount(3, '3');
    await expectUnreadCount(99, '99');
    await expectUnreadCount(100, '99+');

    notificationsNew.value = [];
    await nextTick();
    expect(wrapper.find('.badge-inner').exists()).toBe(false);
    expect(accessibleName(wrapper.get('a').element)).toBe(emptyName);
    await wrapper.get('a').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.name).toBe('notifications');
  });

  it('distinguishes account pagination buttons', async () => {
    const wrapper = mount(BulletSwitcher, {
      attachTo: document.body,
      props: { optionsSize: 3, currentIdx: 1, activeColor: '#fff' },
      global: { plugins: [createTranslations()] },
    });
    const buttons = wrapper.findAll('button');

    expect(buttons.map(({ element }) => accessibleName(element))).toEqual([
      'Select account 1',
      'Select account 2',
      'Select account 3',
    ]);
    expect(buttons[1].attributes('aria-current')).toBe('true');
    const result = await axe.run(document.body, { runOnly: ['button-name', 'link-name'] });
    expect(result.violations).toEqual([]);
    expect(result.passes.some(({ id }) => id === 'button-name')).toBe(true);
  });

  it('names the asset selector before and after an asset is selected', async () => {
    const wrapper = mount(InputSelectAsset, {
      attachTo: document.body,
      global: { plugins: [createTranslations()] },
    });

    expect(accessibleName(wrapper.get('button').element)).toBe('Select asset');
    await wrapper.setProps({ value: { symbol: 'ETH' } as IAsset });
    expect(accessibleName(wrapper.get('button').element)).toBe('ETH');
    await wrapper.setProps({ value: null });
    expect(accessibleName(wrapper.get('button').element)).toBe('Select asset');
  });
});
