import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import Notifications from '../../../../src/popup/pages/Notifications.vue';

jest.mock('../../../../src/popup/components/NotificationItem.vue', () => ({
  template: '<div data-cy="notification-item">{{ notification.title }}</div>',
  props: ['notification'],
}));

jest.mock('../../../../src/popup/components/InfiniteScroll.vue', () => ({
  props: ['items', 'keyExtractor'],
  emits: ['load-more'],
  template: `
    <div>
      <slot
        v-for="(item, index) in items"
        :key="keyExtractor(item, index)"
        :item="item"
        :index="index"
      />
    </div>
  `,
}));

const mockLoadMoreNotifications = jest.fn();
const mockMarkAsReadAll = jest.fn();
const mockInitViewport = jest.fn();
const mockNotificationsToShow = ref([
  {
    createdAt: '2026-05-11T00:00:00.000Z',
    status: 'CREATED',
    type: 'wallet',
    title: 'Secure your account',
    text: 'Please backup your seed phrase',
    isSeedBackup: true,
  },
]);

jest.mock('@/constants', () => ({
  IS_EXTENSION: false,
}));

jest.mock('@/composables', () => ({
  useNotifications: () => ({
    notificationsToShow: mockNotificationsToShow,
    loadMoreNotifications: mockLoadMoreNotifications,
    markAsReadAll: mockMarkAsReadAll,
  }),
  useViewport: () => ({
    initViewport: mockInitViewport,
  }),
}));

describe('Notifications page', () => {
  beforeEach(() => {
    mockLoadMoreNotifications.mockClear();
    mockMarkAsReadAll.mockClear();
    mockInitViewport.mockClear();
  });

  it('renders wallet notifications through InfiniteScroll items', () => {
    const wrapper = mount(Notifications, {
      global: {
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          IonPage: { template: '<div><slot /></div>' },
          IonContent: { template: '<div><slot /></div>' },
          PageWrapper: { template: '<div><slot /></div>' },
        },
      },
    });

    expect(wrapper.find('[data-cy="notification-item"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Secure your account');
    expect(wrapper.text()).not.toContain('pages.notifications.noNotifications');
  });
});
