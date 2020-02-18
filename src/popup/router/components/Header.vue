<template>
  <div class="header" v-if="showNavigation && !aeppPopup">
    <div class="content" :class="{ isLoggedIn }">
      <Arrow v-if="title" @click="goBack" class="back-arrow" />
      <Logo :class="$route.path === '/intro' && !isLoggedIn ? 'intro_style' : ''" v-else />

      <div class="title">
        <span v-if="title">{{ $t(`pages.titles.${title}`) }}</span>
        <span v-else>{{ $t('pages.appVUE.coronaWallet') }}</span>
      </div>

      <div v-if="isLoggedIn">
        <span class="noti-holder" @click="notifications.length && $router.push('/notifications')">
          <span v-if="notifications.length" class="noti-count">{{ notifications.length }}</span>
          <Bell />
        </span>
        <button @click="$emit('toggle-sidebar')">
          <Hamburger />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Arrow from '../../../icons/arrow.svg';
import Bell from '../../../icons/bell.svg';
import Hamburger from '../../../icons/hamburger.svg';
import Logo from '../../../icons/logo-small.svg';

export default {
  components: { Arrow, Bell, Hamburger, Logo },
  computed: {
    ...mapGetters(['isLoggedIn', 'aeppPopup', 'notifications']),
    title() {
      return this.$route.meta.title;
    },
    showNavigation() {
      return this.$route.meta.navigation !== undefined ? this.$route.meta.navigation : true;
    },
  },
  methods: {
    goBack() {
      this.$router.push(this.isLoggedIn ? '/account' : '/');
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';
.header {
  padding-top: env(safe-area-inset-top);
  background-color: $nav-bg-color;
  border-bottom: 3px solid $nav-border-color;
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
    .intro_style {
      position: absolute;
      left: 20px;
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
      left: -8px;
      top: 2px;
      line-height: 16px;
    }
  }
}
</style>
