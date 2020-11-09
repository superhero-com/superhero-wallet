<template>
  <div class="popup">
    <div class="tabs">
      <button :class="{ active: direction === '' }" @click="direction = ''">
        {{ $t('pages.notifications.new') }}
      </button>
      <button :class="{ active: direction === 'wallet' }" @click="direction = 'wallet'">
        {{ $t('pages.notifications.wallet') }}
      </button>
      <button
        class="superhero"
        :class="{ active: direction === 'superhero' }"
        @click="direction = 'superhero'"
      >
        {{ $t('pages.notifications.superhero') }}
      </button>
      <button :class="{ active: direction === 'read' }" @click="direction = 'read'">
        {{ $t('pages.notifications.read') }}
      </button>
    </div>
    <NotificationItem
      v-for="notification in filteredNotifications"
      :key="notification.id"
      :address="notification.sender"
      :name="
        notification.wallet ? notification.title : notification.chainName || 'Fellow Superhero'
      "
      :text="notificationText(notification)"
      :date="new Date(notification.createdAt)"
      :to="notification.path"
      v-bind="notification.wallet && { wallet: true }"
      @click="onClickHandler(notification)"
    >
      <ThreeDotsMenu>
        <div class="mark-as-read" @click="modifyNotificationStatus(notification)">
          {{
            notification.status === 'READ'
              ? $t('pages.notifications.markAsUnread')
              : $t('pages.notifications.markAsRead')
          }}
        </div>
      </ThreeDotsMenu>
    </NotificationItem>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex';
import NotificationItem from '../components/NotificationItem';
import ThreeDotsMenu from '../components/ThreeDotsMenu';
import openUrl from '../../utils/openUrl';

export default {
  components: { NotificationItem, ThreeDotsMenu },
  data: () => ({
    direction: '',
  }),
  computed: {
    ...mapState(['notifications', 'notificationSettings']),
    filteredNotifications() {
      return [...this.observableNotifications, ...this.notifications]
        .filter(
          n =>
            (this.direction === 'read' && n.status === 'READ') ||
            !this.notificationSettings
              .filter(s => !s.checked)
              .map(s => s.type)
              .includes(n.type),
        )
        .filter(
          n =>
            (this.direction === 'read' && n.status === 'READ') ||
            (n.status === 'CREATED' &&
              ((this.direction === 'wallet' && n.wallet) ||
                (this.direction === 'superhero' && n.sender) ||
                this.direction === '')),
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
  },
  methods: {
    ...mapMutations(['setNotificationsStatus']),
    async modifyNotificationStatus(notification) {
      const status = notification.status === 'READ' ? 'CREATED' : 'READ';
      if (notification.wallet) {
        this.setNotificationsStatus({ createdAt: notification.createdAt, status });
      } else {
        await this.$store.dispatch('modifyNotification', [
          notification.id,
          status,
          this.$store.state.account.publicKey,
        ]);
        this.observableNotifications.find(n => n.id === notification.id).status = status;
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
      if (notification.wallet) return notification.text;
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
    background-color: #272831;
    display: flex;
    align-items: center;
    padding: 0 1rem;

    button {
      display: inline-block;
      background: transparent;
      text-align: center;
      flex-grow: 1;
      font-size: 0.95rem;
      cursor: pointer;
      color: #727278;
      font-weight: 600;
      padding: 0.95rem 0;
      margin-left: 1rem;
      border-bottom: 0.1rem solid transparent;

      &:first-child {
        margin-left: 0;
      }

      &.superhero {
        flex-grow: 2;
      }

      &:hover {
        color: #d9d9d9;
      }

      &.active {
        color: #67f7b8;
        border-bottom-color: #67f7b8;
      }
    }
  }

  .notification-item {
    margin-top: 0.2rem;
    background-color: #1d1e27;
    font-size: 0.95rem;
    padding-top: 0.9rem;
    text-align: left;
    cursor: pointer;

    .three-dots {
      color: #515259;
      font-size: 1.5rem;
      line-height: 0;
      text-align: right;

      &:hover {
        color: #fff;
      }

      .mark-as-read {
        font-size: 0.9rem;
        line-height: 1.2rem;
      }
    }
  }
}
</style>
