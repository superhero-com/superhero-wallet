<template>
  <div class="header" v-if="showNavigation && !aeppPopup">
    <div class="content">
      <div class="left">
        <Logo class="logo" v-if="isLoggedIn" />
        <button v-if="title && !tourRunning" @click="back" class="icon-btn back">
          <Back data-cy="back-arrow" />
        </button>
      </div>

      <div class="title">
        <TruncateMid
          :str="pageTitle || (title && $t(`pages.titles.${title}`)) || $t('pages.titles.home')"
          class="text"
        />
      </div>

      <div class="right">
        <template v-if="isLoggedIn">
          <span
            v-if="!$route.path.startsWith('/notifications')"
            @click="toNotifications"
            class="notifications"
            data-cy="noti"
          >
            <button class="icon-btn">
              <Bell />
            </button>
            <span v-if="notificationsCount" class="badge" data-cy="noti-count">
              {{ notificationsCount }}
            </span>
          </span>

          <button
            v-if="$route.path === '/notifications'"
            @click="$router.push('/notifications/settings')"
            class="icon-btn settings"
          >
            <Settings />
          </button>

          <button @click="$emit('toggle-sidebar')" class="icon-btn">
            <Menu data-cy="hamburger" />
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex';
import Logo from '../../../icons/logo-small.svg?vue-component';
import Back from '../../../icons/back.svg?vue-component';
import Bell from '../../../icons/bell.svg?vue-component';
import Settings from '../../../icons/notif-settings.svg?vue-component';
import Menu from '../../../icons/menu.svg?vue-component';
import TruncateMid from './TruncateMid';

export default {
  components: { Logo, Back, Bell, Settings, Menu, TruncateMid },
  data: () => ({
    aeppPopup: window.RUNNING_IN_POPUP,
  }),
  subscriptions() {
    return {
      superheroNotifications: this.$store.state.observables.notifications,
    };
  },
  computed: {
    ...mapState(['tourRunning', 'isLoggedIn', 'notifications', 'pageTitle']),
    title() {
      return this.$route.meta.title;
    },
    showNavigation() {
      return this.$route.meta.navigation !== undefined ? this.$route.meta.navigation : true;
    },
    notificationsCount() {
      return [...this.notifications, ...this.superheroNotifications].filter(
        (n) => n.status === 'CREATED',
      ).length;
    },
  },
  methods: {
    ...mapMutations(['setNotificationsStatus']),
    back() {
      const fallBackRoute = this.isLoggedIn ? '/account' : '/';
      this.$router.push(
        this.$route.fullPath.substr(0, this.$route.fullPath.lastIndexOf('/')) || fallBackRoute,
      );
    },
    async toNotifications() {
      this.notifications.forEach((n) =>
        this.setNotificationsStatus({ createdAt: n.createdAt, status: 'PEEKED' }),
      );
      await this.$store.dispatch('modifyNotifications', [
        this.superheroNotifications.filter((n) => n.status === 'CREATED').map((n) => n.id),
        'PEEKED',
      ]);
      if (this.$store.state.route.fullPath !== '/notifications') {
        this.$router.push('/notifications');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/typography';

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 8;
  height: calc(50px + env(safe-area-inset-top));
  background-color: $color-black;
  display: flex;
  justify-content: center;
  align-items: center;

  .content {
    flex: 1;
    max-width: $container-width;
    height: 50px;
    padding: 0 10px;
    padding-top: env(safe-area-inset-top);
    display: flex;
    align-items: center;

    .left,
    .right {
      flex-basis: 80px;
      display: flex;
      align-items: center;
    }

    .right {
      justify-content: flex-end;
    }

    .title {
      flex: 1 0;

      .text {
        max-width: 180px;
        padding: 0 4px;
        display: flex;
        justify-content: center;

        @extend %face-sans-16-medium;

        color: $color-white;
      }
    }

    .logo {
      width: 34px;
      height: 24px;
    }

    .back {
      margin-left: 10px;
    }

    .settings,
    .notifications {
      margin-right: 10px;
    }

    .icon-btn {
      cursor: pointer;
      width: 32px;
      height: 32px;
      padding: 0;
      opacity: 0.7;
      display: flex;
      justify-content: center;
      align-items: center;

      svg {
        width: 24px;
        height: 24px;

        path {
          fill: $color-white;
        }
      }

      &:hover {
        opacity: 1;
        border-radius: 50%;
        background-color: $color-hover;
      }
    }

    .notifications {
      position: relative;
      cursor: pointer;

      .badge {
        position: absolute;
        left: -2px;
        top: 20%;
        width: 14px;
        height: 14px;
        background: $color-blue;
        border-radius: 50%;
        text-align: center;
        font-size: 12px;
        line-height: 14px;
      }
    }
  }
}
</style>
