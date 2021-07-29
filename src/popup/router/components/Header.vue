<template>
  <div
    v-if="showNavigation && !aeppPopup"
    class="header"
    :class="{ 'not-logged-in': !isLoggedIn }"
  >
    <div
      v-if="isLoggedIn || (title && !tourRunning)"
      class="left"
    >
      <RouterLink
        v-if="isLoggedIn"
        to="/account"
        class="home-button"
      >
        <Logo />
      </RouterLink>
      <ButtonPlain
        v-if="title && !tourRunning"
        class="icon-btn back"
        @click="back"
      >
        <Back data-cy="back-arrow" />
      </ButtonPlain>
    </div>

    <div
      class="title"
    >
      <Truncate
        v-if="pageTitle"
        :str="pageTitle"
        class="text"
      />
      <span
        v-else
        class="text"
      >
        {{ (title && $t(`pages.titles.${title}`)) || $t('pages.titles.wallet-home') }}
      </span>
    </div>

    <div
      v-if="isLoggedIn"
      class="right"
    >
      <ButtonPlain
        v-if="!$route.path.startsWith('/notifications')"
        class="notifications icon-btn"
        data-cy="noti"
        @click="toNotifications"
      >
        <Bell />
        <span
          v-if="notificationsCount"
          class="badge"
          data-cy="noti-count"
        >
          {{ notificationsCount }}
        </span>
      </ButtonPlain>

      <RouterLink
        v-if="$route.path === '/notifications'"
        to="/notifications/settings"
        class="icon-btn settings"
      >
        <Settings />
      </RouterLink>

      <RouterLink
        v-if="$route.path !== '/more'"
        class="icon-btn"
        to="/more"
        data-cy="page-more"
      >
        <ThreeDots />
      </RouterLink>
      <RouterLink
        v-else
        class="icon-btn"
        :to="$store.state.route.from ? $store.state.route.from.fullPath : '/account'"
      >
        <Close />
      </RouterLink>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations } from 'vuex';
import Logo from '../../../icons/logo-small.svg?vue-component';
import Back from '../../../icons/back.svg?vue-component';
import Bell from '../../../icons/bell.svg?vue-component';
import Settings from '../../../icons/notif-settings.svg?vue-component';
import ThreeDots from '../../../icons/three-dots.svg?vue-component';
import Close from '../../../icons/close.svg?vue-component';
import Truncate from './Truncate';
import ButtonPlain from './ButtonPlain';

export default {
  components: {
    Logo, Back, Bell, Settings, ThreeDots, Close, Truncate, ButtonPlain,
  },
  data: () => ({
    aeppPopup: window.RUNNING_IN_POPUP,
  }),
  subscriptions() {
    return {
      superheroNotifications: this.$store.state.observables.notifications,
    };
  },

  computed: {
    ...mapGetters(['isLoggedIn']),
    ...mapState(['tourRunning', 'notifications', 'pageTitle']),
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
      let { fullPath } = this.$route;
      fullPath = fullPath.endsWith('/') ? fullPath.slice(0, -1) : fullPath;
      this.$router.push(
        fullPath.substr(0, fullPath.lastIndexOf('/')) || fallBackRoute,
      );
    },
    async toNotifications() {
      this.notifications.forEach((n) => this.setNotificationsStatus({ createdAt: n.createdAt, status: 'PEEKED' }));
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
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.header {
  position: fixed;
  width: 360px;

  @include mixins.desktop {
    position: sticky;
  }

  top: 0;
  z-index: 1;
  height: calc(48px + env(safe-area-inset-top));
  background-color: variables.$color-bg-3;
  display: flex;
  padding: 8px 16px 8px 8px;
  padding-top: calc(8px + env(safe-area-inset-top));
  align-items: center;

  @include mixins.mobile {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .left {
    display: flex;
    flex-basis: 88px;
  }

  .right {
    display: flex;
    flex-basis: 82px;
    justify-content: flex-end;
  }

  .title {
    min-width: 166px;

    .text {
      padding: 0 4px;
      display: flex;
      justify-content: center;
      white-space: nowrap;

      @extend %face-sans-16-medium;

      line-height: 24px;
      color: variables.$color-white;
    }
  }

  &.not-logged-in:not(:only-child) {
    .left {
      z-index: 1;
    }

    .title {
      width: 100%;
      position: absolute;
    }
  }

  .left .home-button {
    padding: 4px 0;
    height: 32px;

    &:not(:disabled) {
      svg {
        cursor: pointer;
      }

      &:hover svg {
        color: variables.$color-blue-hover;
      }

      &:active svg {
        color: variables.$color-blue-hover;
        opacity: 0.9;
      }
    }

    svg {
      width: 34px;
      height: 24px;
      color: variables.$color-blue;
    }
  }

  .home-button + .back {
    margin-left: 22px;
  }

  .title:only-child {
    flex-grow: 2;
    margin-left: 8px;
  }

  .settings,
  .notifications {
    margin-right: 8px;
  }

  .icon-btn {
    width: 32px;
    height: 32px;
    display: flex;
    justify-content: center;
    align-items: center;

    svg {
      width: 24px;
      height: 24px;
      color: variables.$color-white;
      opacity: 0.7;

      &.hover {
        display: none;
      }
    }

    &:hover {
      border-radius: 50%;
      background-color: variables.$color-hover;

      svg {
        opacity: 1;
      }
    }
  }

  .notifications {
    position: relative;

    .badge {
      color: variables.$color-white;
      position: absolute;
      left: -2px;
      top: 20%;
      width: 14px;
      height: 14px;
      background: variables.$color-blue;
      border-radius: 50%;
      text-align: center;
      font-size: 12px;
      line-height: 14px;
    }
  }
}
</style>
