<template>
  <div class="header" v-if="showNavigation && !aeppPopup">
    <div class="content" :class="{ isLoggedIn }">
      <Arrow v-if="title && !tourRunning" @click="back" class="back-arrow" data-cy="back-arrow" />
      <Logo :class="$route.path === '/intro' && !isLoggedIn ? 'intro_style' : ''" v-else />

      <div class="title">
        <span v-show="title">{{ $t(`pages.titles.${title}`) }}</span>
        <span v-show="!title">{{ $t('pages.titles.home') }}</span>
      </div>

      <div v-if="isLoggedIn">
        <span class="noti-holder" @click="toNotifications" data-cy="noti">
          <span v-if="notificationsCount" class="noti-count" data-cy="noti-count">{{
            notificationsCount
          }}</span>
          <Bell />
        </span>
        <button @click="$emit('toggle-sidebar')">
          <Hamburger data-cy="hamburger" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Arrow from '../../../icons/arrow.svg?vue-component';
import Bell from '../../../icons/bell.svg?vue-component';
import Hamburger from '../../../icons/hamburger.svg?vue-component';
import Logo from '../../../icons/logo-small.svg?vue-component';

export default {
  components: { Arrow, Bell, Hamburger, Logo },
  data: () => ({
    aeppPopup: window.RUNNING_IN_POPUP,
  }),
  computed: {
    ...mapState(['tourRunning', 'isLoggedIn', 'notifications']),
    title() {
      return this.$route.meta.title;
    },
    showNavigation() {
      return this.$route.meta.navigation !== undefined ? this.$route.meta.navigation : true;
    },
    notificationsCount() {
      return this.notifications.filter(n => !n.visited).length;
    },
  },
  methods: {
    back() {
      if (this.$store.state.route.from.path === '/') {
        this.$router.push(this.isLoggedIn ? '/account' : '/');
        return;
      }
      this.$router.go(-1);
    },
    toNotifications() {
      if (this.notifications.length && this.$store.state.route.fullPath !== '/notifications') {
        this.$router.push('/notifications');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

.header {
  padding-top: env(safe-area-inset-top);
  background-color: $nav-bg-color;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 8;

  .content {
    height: 50px;
    max-width: 357px;
    margin: 0 auto;
    padding: 0 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: $white-1;

    .title {
      font-size: 18px;
    }

    &:not(.isLoggedIn) .title {
      margin-left: auto;
      margin-right: auto;
    }

    .back-arrow {
      cursor: pointer;
    }

    &.isLoggedIn {
      justify-content: space-between;
      position: relative;

      > :not(.title) {
        z-index: 1;
      }

      .title {
        position: absolute;
        left: 0;
        right: 0;
        text-align: center;
      }

      .start-onboarding {
        margin-left: 13px;
        cursor: pointer;
      }
    }

    svg {
      vertical-align: middle;
    }

    button {
      padding: 0;
      margin-left: 5px;
    }

    .noti-holder {
      position: relative;
      cursor: pointer;
    }

    .noti-count {
      position: absolute;
      background: $secondary-color;
      font-size: 12px;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      text-align: center;
      vertical-align: middle;
      left: -10px;
      top: 0;
      line-height: 15px;
      border: 1px solid $nav-bg-color;
    }
  }
}
</style>
