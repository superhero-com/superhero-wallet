<template>
  <div class="popup">
    <div class="tabs">
      <button :class="{ active: direction === '' }" @click="direction = ''">
        {{ $t('pages.notifications.all') }}
      </button>
      <button :class="{ active: direction === 'superhero' }" @click="direction = 'superhero'">
        {{ $t('pages.notifications.superhero') }}
      </button>
      <button :class="{ active: direction === 'wallet' }" @click="direction = 'wallet'">
        {{ $t('pages.notifications.wallet') }}
      </button>
    </div>
    <NotificationItem
      v-for="notification in filteredNotifications"
      :key="notification.id"
      :address="notification.sender || ''"
      :name="
        notification.wallet ? notification.title : notification.chainName || 'Fellow Superhero'
      "
      :text="notificationText(notification)"
      :date="new Date(notification.createdAt)"
      :to="notification.path"
      :status="notification.status.toLocaleLowerCase()"
      v-bind="notification.wallet && { wallet: true }"
      @click="onClickHandler(notification)"
      @toggle-read="modifyNotificationStatus(notification)"
    />
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex';
import NotificationItem from '../components/NotificationItem';
import openUrl from '../../utils/openUrl';

export default {
  components: { NotificationItem },
  data: () => ({
    direction: '',
  }),
  computed: {
    ...mapState(['notifications', 'notificationSettings']),
    filteredNotifications() {
      return [...this.observableNotifications, ...this.notifications]
        .filter(
          (n) =>
            this.direction === '' ||
            (this.direction === 'superhero' && n.type !== 'wallet') ||
            (this.direction === 'wallet' && n.type === 'wallet'),
        )
        .filter(
          (n) =>
            n.status === 'READ' ||
            this.notificationSettings
              .filter((s) => s.checked)
              .map((s) => s.type)
              .includes(n.type),
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
  },
  methods: {
    ...mapMutations(['setNotificationsStatus']),
    async modifyNotificationStatus(notification) {
      const status = notification.status === 'READ' ? 'CREATED' : 'READ';
      if (notification.type === 'wallet') {
        this.setNotificationsStatus({ createdAt: notification.createdAt, status });
      } else {
        await this.$store.dispatch('modifyNotification', [notification.id, status]);
        this.observableNotifications.find((n) => n.id === notification.id).status = status;
      }
    },
    async onClickHandler(notification) {
      await this.modifyNotificationStatus(notification);
      if (/^\w+:\D+/.test(notification.path)) {
        openUrl(notification.path, true);
      } else {
        this.$router.push(notification.path);
      }
    },
    notificationText(notification) {
      switch (notification.type) {
        case 'COMMENT_ON_COMMENT':
          return this.$t('pages.notifications.commentOnComment');
        case 'COMMENT_ON_TIP':
          return this.$t('pages.notifications.commentOnTip');
        case 'TIP_ON_COMMENT':
          return this.$t('pages.notifications.tipOnComment');
        case 'RETIP_ON_TIP':
          return this.$t('pages.notifications.retipOnTip');
        case 'CLAIM_OF_TIP':
          return this.$t('pages.notifications.claimOfTip');
        case 'CLAIM_OF_RETIP':
          return this.$t('pages.notifications.claimOfRetip');
        case 'wallet':
          return notification.text;
        default:
          throw new Error(`Unknown notification status: ${notification.type}`);
      }
    },
  },
  subscriptions() {
    return {
      observableNotifications: this.$store.state.observables.notifications,
    };
  },
};
</script>

<style lang="scss" scoped>
.popup {
  padding: 0;

  .tabs {
    position: sticky;
    top: 50px;
    z-index: 100;
    background-color: #141414;
    padding: 0 1rem;
    text-align: left;

    button {
      display: inline-block;
      background: transparent;
      text-align: center;
      font-size: 0.95rem;
      cursor: pointer;
      color: #787878;
      font-weight: 600;
      padding: 0.95rem 0;
      margin-left: 1rem;
      border-bottom: 0.2rem solid transparent;

      &:hover {
        color: #babac0;
      }

      &.active {
        color: #67f7b8;
        border-bottom-color: #67f7b8;
      }
    }
  }
}
</style>
