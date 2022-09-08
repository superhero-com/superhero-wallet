<template>
  <div
    v-if="showNavigation && !aeppPopup"
    :class="['header', { 'not-logged-in': !isLoggedIn, 'new-ui': $route.meta.newUI }]"
  >
    <div
      v-if="isLoggedIn || title"
      class="left"
    >
      <RouterLink
        v-if="isLoggedIn && !showBack"
        to="/account"
        class="home-button"
      >
        <Logo />
      </RouterLink>
      <ButtonPlain
        v-if="showBack"
        class="icon-btn"
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
    </div>

    <div
      v-if="isLoggedIn"
      class="right"
    >
      <ButtonPlain
        v-if="!$route.path.startsWith('/notifications') && !hideNotificationsIcon"
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
        v-if="$route.path !== '/more' && !$route.meta.closeButton"
        class="icon-btn"
        to="/more"
        data-cy="page-more"
      >
        <ThreeDots />
      </RouterLink>
      <ButtonPlain
        v-else
        class="icon-btn close"
        data-cy="close"
        @click="close"
      >
        <Close />
      </ButtonPlain>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations } from 'vuex';
import Logo from '../../../icons/logo-small.svg?vue-component';
import Back from '../../../icons/back.svg?vue-component';
import Bell from '../../../icons/bell.svg?vue-component';
import ThreeDots from '../../../icons/three-dots.svg?vue-component';
import Close from '../../../icons/close.svg?vue-component';
import Truncate from './Truncate.vue';
import ButtonPlain from './ButtonPlain.vue';

export default {
  components: {
    Logo, Back, Bell, ThreeDots, Close, Truncate, ButtonPlain,
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
    ...mapState(['notifications', 'pageTitle']),
    title() {
      return this.$route.meta.title;
    },
    showNavigation() {
      return this.$route.meta.navigation !== undefined ? this.$route.meta.navigation : true;
    },
    showBack() {
      return (this.$route.meta.backButton !== undefined ? this.$route.meta.backButton : true)
        && this.title;
    },
    hideNotificationsIcon() {
      return this.$route.meta.hideNotificationsIcon;
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
    close() {
      this.$router.replace(
        this.isLoggedIn ? '/account' : '/',
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

  @include mixins.desktop {
    position: sticky;
  }

  top: 0;
  z-index: 2;
  height: calc(48px + env(safe-area-inset-top));
  background-color: variables.$color-bg-3-new;
  display: flex;
  padding: env(safe-area-inset-top) 8px 8px 8px;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  @include mixins.mobile {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  &.new-ui {
    background-color: variables.$color-bg-3-new;
  }

  .left {
    display: flex;
    width: 20%;
  }

  .right {
    display: flex;
    justify-content: flex-end;
    width: 20%;
  }

  .title {
    width: 60%;

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
        color: variables.$color-primary-hover;
      }

      &:active svg {
        color: variables.$color-primary-hover;
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

    .back {
      width: 19.09px;
      height: 16px;
    }

    &.close svg {
      color: rgba(variables.$color-white, 0.5);
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

      @extend %face-sans-12-regular;
    }
  }
}
</style>
