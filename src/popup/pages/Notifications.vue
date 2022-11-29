<template>
  <div class="notifications">
    <InfiniteScroll
      :is-more-data="canLoadMore"
      @loadMore="loadMore"
    >
      <NotificationItem
        v-for="notification in notificationsToShow"
        :key="notification.id"
        :address="notification.sender || ''"
        :id="notification.id"
        :name="
          notification.wallet ? notification.title : notification.chainName || 'Fellow Superhero'
        "
        :text="getNotificationText(notification)"
        :date="new Date(notification.createdAt)"
        :to="notification.path"
        :status="notification.status"
        v-bind="notification.wallet && { wallet: true }"
        @click="onClickHandler(notification)"
        @toggle-read="toggleNotificationStatus(notification)"
      />
    </InfiniteScroll>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  Ref,
  ref,
  watch,
} from '@vue/composition-api';
import type { INotification, INotificationSetting, NotificationStatus } from '../../types';
import {
  NOTIFICATION_STATUS_CREATED,
  NOTIFICATION_STATUS_PEEKED,
  NOTIFICATION_STATUS_READ,
  NOTIFICATION_TYPE_WALLET,
  NOTIFICATION_TYPE_COMMENT_ON_TIP,
  NOTIFICATION_TYPE_COMMENT_ON_COMMENT,
  NOTIFICATION_TYPE_TIP_ON_COMMENT,
  NOTIFICATION_TYPE_CLAIM_OF_TIP,
  NOTIFICATION_TYPE_CLAIM_OF_RETIP,
  NOTIFICATION_TYPE_RETIP_ON_TIP,
  waitUntilTruthy,
  rxJsObservableToVueState,
} from '../utils';
import NotificationItem from '../components/NotificationItem.vue';
import { IS_MOBILE_DEVICE } from '../../lib/environment';
import InfiniteScroll from '../components/InfiniteScroll.vue';

const DIR_ALL = 'all';
const DIR_WALLET = 'wallet';
const DIR_SUPERHERO = 'superhero';

const COUNT_OF_CHUNK = 20;

export default defineComponent({
  name: 'Notifications',
  components: {
    InfiniteScroll,
    NotificationItem,
  },
  setup(props, { root }) {
    const direction = ref(DIR_ALL);
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

    async function modifyNotificationStatus(
      notification: INotification,
      status: NotificationStatus,
    ) {
      if (notification.type === NOTIFICATION_TYPE_WALLET) {
        root.$store.commit('setNotificationsStatus', { createdAt: notification.createdAt, status });
      } else {
        await root.$store.dispatch('modifyNotification', [notification.id, status]);

        const storedNotification = superheroNotifications.value
          .find((n) => n.id === notification.id);

        if (storedNotification) {
          storedNotification.status = status;
        }
      }
    }

    async function toggleNotificationStatus(notification: INotification) {
      const newStatus = (notification.status === NOTIFICATION_STATUS_READ)
        ? NOTIFICATION_STATUS_CREATED
        : NOTIFICATION_STATUS_READ;
      return modifyNotificationStatus(notification, newStatus);
    }

    async function onClickHandler(notification: INotification) {
      await modifyNotificationStatus(notification, NOTIFICATION_STATUS_READ);
      if (notification.path) {
        if (typeof notification.path === 'string' && /^\w+:\D+/.test(notification.path)) {
          window.open(notification.path, IS_MOBILE_DEVICE ? '_self' : '_blank');
        } else {
          root.$router.push(notification.path);
        }
      }
    }

    function getNotificationText(notification: INotification) {
      switch (notification.type) {
        case NOTIFICATION_TYPE_COMMENT_ON_COMMENT:
          return root.$t('pages.notifications.commentOnComment');
        case NOTIFICATION_TYPE_COMMENT_ON_TIP:
          return root.$t('pages.notifications.commentOnTip');
        case NOTIFICATION_TYPE_TIP_ON_COMMENT:
          return root.$t('pages.notifications.tipOnComment');
        case NOTIFICATION_TYPE_RETIP_ON_TIP:
          return root.$t('pages.notifications.retipOnTip');
        case NOTIFICATION_TYPE_CLAIM_OF_TIP:
          return root.$t('pages.notifications.claimOfTip');
        case NOTIFICATION_TYPE_CLAIM_OF_RETIP:
          return root.$t('pages.notifications.claimOfRetip');
        case NOTIFICATION_TYPE_WALLET:
          return notification.text;
        default:
          throw new Error(`Unknown notification status: ${notification.type}`);
      }
    }

    async function setNotificationsStatusesAsPeeked() {
      await waitUntilTruthy(() => root.$store.getters['sdkPlugin/sdk']);

      notifications.value
        .filter(({ status }) => status === NOTIFICATION_STATUS_CREATED)
        .forEach(({ createdAt }) => root.$store.commit('setNotificationsStatus', {
          createdAt,
          status: NOTIFICATION_STATUS_PEEKED,
        }));

      await root.$store.dispatch('modifyNotifications', [
        superheroNotifications.value
          .filter(({ status }) => status === NOTIFICATION_STATUS_CREATED)
          .map(({ id }) => id),
        NOTIFICATION_STATUS_PEEKED,
      ]);
    }

    setNotificationsStatusesAsPeeked();

    const loadMore = () => {
      canLoadMore.value = false;
      const from = notificationsToShow.value.length;
      const to = from + COUNT_OF_CHUNK;
      notificationsToShow.value.push(...filteredNotifications.value.slice(from, to));
      if (notificationsToShow.value.length < filteredNotifications.value.length) {
        canLoadMore.value = true;
      }
    };

    watch(() => filteredNotifications.value, () => {
      notificationsToShow.value = [];
      loadMore();
    });

    onMounted(() => {
      loadMore();
    });

    return {
      DIR_WALLET,
      DIR_SUPERHERO,
      DIR_ALL,
      direction,
      filteredNotifications,
      notificationsToShow,
      canLoadMore,
      getNotificationText,
      onClickHandler,
      toggleNotificationStatus,
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
