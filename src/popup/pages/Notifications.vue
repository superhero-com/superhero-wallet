<template>
  <div class="notifications">
    <InfiniteScroll
      :is-more-data="canLoadMore"
      @loadMore="loadMore"
    >
      <NotificationItem
        v-for="notification in notificationsToShow"
        :key="notification.id"
        :notification="notification"
      />
    </InfiniteScroll>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent, onBeforeUnmount,
  onMounted,
  Ref,
  ref,
  watch,
} from '@vue/composition-api';
import type { INotification, INotificationSetting } from '../../types';
import {
  NOTIFICATION_STATUS_READ, NOTIFICATION_TYPE_WALLET,
  rxJsObservableToVueState,
} from '../utils';
import NotificationItem from '../components/NotificationItem.vue';
import InfiniteScroll from '../components/InfiniteScroll.vue';

const COUNT_OF_CHUNK = 20;

export default defineComponent({
  name: 'Notifications',
  components: {
    InfiniteScroll,
    NotificationItem,
  },
  setup(props, { root }) {
    const notificationsToShow = ref<INotification[]>([]);
    const canLoadMore = ref(true);

    const notifications = computed<INotification[]>(
      () => root.$store.state.notifications,
    );

    const notificationSettings = computed<INotificationSetting[]>(
      () => root.$store.state.notificationSettings,
    );

    const notificationSettingsCheckedTypes = computed<string[]>(
      () => notificationSettings.value.filter((s) => s.checked).map((s) => s.type),
    );

    const superheroNotifications = rxJsObservableToVueState(
      root.$store.state.observables.notifications,
      [],
    ) as Ref<INotification[]>;

    const filteredNotifications = computed<INotification[]>(
      () => [...superheroNotifications.value, ...notifications.value]
        .filter(
          ({ status, type }) => (
            status === NOTIFICATION_STATUS_READ
            || notificationSettingsCheckedTypes.value.includes(type)
          ),
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    );

    function loadMore() {
      canLoadMore.value = false;
      const from = notificationsToShow.value.length;
      const to = from + COUNT_OF_CHUNK;
      notificationsToShow.value.push(...filteredNotifications.value.slice(from, to));
      if (notificationsToShow.value.length < filteredNotifications.value.length) {
        canLoadMore.value = true;
      }
    }

    async function handleMarkAsReadSuperhero() {
      const unreadNotificationsIds = superheroNotifications.value
        .filter((notification) => notification.status !== NOTIFICATION_STATUS_READ)
        .map((notification) => notification.id);
      await root.$store.dispatch('modifyNotifications', [unreadNotificationsIds, NOTIFICATION_STATUS_READ]);

      // TODO - come up with better way of updating the statuses locally
      filteredNotifications.value.map((notification) => {
        // eslint-disable-next-line no-param-reassign
        notification.status = NOTIFICATION_STATUS_READ;
        return notification;
      });
    }

    function handleMarkAsReadWallet() {
      notifications.value.map((notification) => {
        if (notification.type === NOTIFICATION_TYPE_WALLET) {
          root.$store.commit('setNotificationsStatus', { createdAt: notification.createdAt, status: NOTIFICATION_STATUS_READ });
        }
        return notification;
      });
    }

    watch(() => filteredNotifications.value, () => {
      notificationsToShow.value = [];
      loadMore();
    });

    onMounted(() => {
      loadMore();
    });

    onBeforeUnmount(() => {
      handleMarkAsReadWallet();
      handleMarkAsReadSuperhero();
    });

    return {
      filteredNotifications,
      notificationsToShow,
      canLoadMore,
      loadMore,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

.notifications {
  position: relative;
  padding: 0;

  .tabs-wrapper {
    position: sticky;
    top: var(--header-height);
    z-index: 1;
    padding: var(--gap) var(--screen-padding-x);
    background-color: var(--screen-bg-color);
  }
}
</style>
