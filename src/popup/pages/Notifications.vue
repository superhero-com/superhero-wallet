<template>
  <div class="notifications">
    <div class="tabs-wrapper">
      <Tabs>
        <Tab
          :text="$t('pages.notifications.all')"
          :active="direction === DIR_ALL"
          @click="direction = DIR_ALL"
        />
        <Tab
          :text="$t('pages.notifications.superhero')"
          :active="direction === DIR_SUPERHERO"
          @click="direction = DIR_SUPERHERO"
        />
        <Tab
          :text="$t('pages.notifications.wallet')"
          :active="direction === DIR_WALLET"
          @click="direction = DIR_WALLET"
        />
      </Tabs>
    </div>

    <div class="list">
      <NotificationItem
        v-for="notification in filteredNotifications"
        :key="notification.id"
        :address="notification.sender || ''"
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
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  Ref,
  ref,
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
import Tabs from '../components/tabs/Tabs.vue';
import Tab from '../components/tabs/Tab.vue';
import { IS_MOBILE_DEVICE } from '../../lib/environment';

const DIR_ALL = 'all';
const DIR_WALLET = 'wallet';
const DIR_SUPERHERO = 'superhero';

export default defineComponent({
  name: 'Notifications',
  components: {
    NotificationItem,
    Tabs,
    Tab,
  },
  setup(props, { root }) {
    const direction = ref(DIR_ALL);

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
          ({ type }) => (
            direction.value === DIR_ALL
            || (direction.value === DIR_SUPERHERO && type !== NOTIFICATION_TYPE_WALLET)
            || (direction.value === DIR_WALLET && type === NOTIFICATION_TYPE_WALLET)
          ),
        )
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

    return {
      DIR_WALLET,
      DIR_SUPERHERO,
      DIR_ALL,
      direction,
      filteredNotifications,
      getNotificationText,
      onClickHandler,
      toggleNotificationStatus,
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
    z-index: 1;
    padding: var(--gap) var(--screen-padding-x);
    background-color: var(--screen-bg-color);
  }
}
</style>
