<template>
  <div
    v-if="showNavigation && !RUNNING_IN_POPUP"
    :class="['header', { 'not-logged-in': !isLoggedIn }]"
  >
    <div
      v-if="isLoggedIn || title"
      class="left"
    >
      <Component
        :is="isDiamondDisabled ? 'div' : 'RouterLink'"
        v-if="isLoggedIn && !showBack"
        :to="isDiamondDisabled ? null : { name: 'account' }"
        :class="['home-button', { 'disabled': isDiamondDisabled }]"
      >
        <Logo class="home-icon" />
      </Component>
      <BtnPlain
        v-if="showBack"
        class="icon-btn"
        @click="back"
      >
        <Back data-cy="back-arrow" />
      </BtnPlain>
    </div>

    <div
      class="title"
    >
      <Truncate
        :str="truncateStr"
        class="text"
      />
    </div>

    <div
      v-if="isLoggedIn"
      class="right"
    >
      <NotifyBell />

      <RouterLink
        v-if="$route.path !== '/more' && !$route.meta.closeButton"
        class="icon-btn"
        to="/more"
        data-cy="page-more"
      >
        <ThreeDots />
      </RouterLink>

      <BtnClose
        v-else
        data-cy="close"
        @click="close"
      />
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations } from 'vuex';
import { RUNNING_IN_POPUP } from '../../lib/environment';
import Logo from '../../icons/logo-small.svg?vue-component';
import Back from '../../icons/back.svg?vue-component';
import Bell from '../../icons/bell.svg?vue-component';
import ThreeDots from '../../icons/three-dots.svg?vue-component';
import Close from '../../icons/close.svg?vue-component';
import Truncate from './Truncate.vue';
import BtnPlain from './buttons/BtnPlain.vue';
import BtnClose from './buttons/BtnClose.vue';
import NotifyBell from './NotifyBell.vue';

export default {
  components: {
    NotifyBell,
    BtnClose,
    Logo,
    Back,
    Bell,
    ThreeDots,
    Close,
    Truncate,
    BtnPlain,
  },
  data: () => ({
    RUNNING_IN_POPUP,
  }),
  subscriptions() {
    return {
      superheroNotifications: this.$store.state.observables.notifications,
    };
  },
  computed: {
    ...mapGetters(['isLoggedIn']),
    ...mapState(['notifications', 'pageTitle']),
    truncateStr() {
      const { pageTitle, title } = this;
      return pageTitle || (title ? this.$t(`pages.titles.${title}`) : '');
    },
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
    isDiamondDisabled() {
      return this.$route.name === 'account';
    },
  },
  methods: {
    ...mapMutations(['setNotificationsStatus']),
    back() {
      if (this.$store.state.route.from.path === '/') {
        this.$router.push(this.isLoggedIn ? '/account' : '/');
        return;
      }
      if (this.$route.meta?.backRoute) {
        // TODO: rewrite back button logic in more unified way
        this.$router.push(this.$route.meta?.backRoute);
        return;
      }
      this.$router.back();
    },
    close() {
      this.$router.replace(
        this.isLoggedIn ? '/account' : '/',
      );
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.header {
  position: fixed;

  @include mixins.desktop {
    position: sticky;
  }

  display: flex;
  align-items: center;
  justify-content: space-between;
  top: 0;
  z-index: 2;
  height: calc(var(--header-height) + env(safe-area-inset-top));
  background-color: var(--screen-bg-color);
  padding: env(safe-area-inset-top) 8px 0;
  width: 100%;

  @include mixins.mobile {
    display: flex;
    justify-content: space-between;
    width: 100%;
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
    &.disabled {
      cursor: default;
    }

    &:not(.disabled) {
      .home-icon {
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

    .home-icon {
      width: 32px;
      height: 32px;
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
    min-width: 32px;
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
      background-color: variables.$color-grey-dark-hover;

      svg {
        opacity: 1;
      }
    }
  }
}
</style>
