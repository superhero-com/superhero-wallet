<template>
  <div
    v-if="showNavigation && !RUNNING_IN_POPUP"
    :class="['header', { 'not-logged-in': !isLoggedIn, 'modal-header': modalHeader }]"
  >
    <div
      v-if="isLoggedIn || title"
      class="left"
    >
      <Component
        :is="isLogoDisabled ? 'div' : 'RouterLink'"
        v-if="isLoggedIn && !showBack"
        :to="isLogoDisabled ? null : { name: 'account' }"
        :class="['home-button', { 'disabled': isLogoDisabled }]"
      >
        <Logo class="home-icon" />
      </Component>
      <BtnIcon
        v-if="showBack"
        class="icon-btn"
        @click="back"
      >
        <BackIcon data-cy="back-arrow" />
      </BtnIcon>
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
      <NotifyBell v-if="showNotifications" />

      <BtnIcon
        v-if="showMore"
        :to="{ name: 'more' }"
        data-cy="page-more"
      >
        <ThreeDots />
      </BtnIcon>

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
import BackIcon from '../../icons/back.svg?vue-component';
import Bell from '../../icons/bell.svg?vue-component';
import ThreeDots from '../../icons/three-dots.svg?vue-component';
import Close from '../../icons/close.svg?vue-component';
import Truncate from './Truncate.vue';
import BtnPlain from './buttons/BtnPlain.vue';
import BtnClose from './buttons/BtnClose.vue';
import NotifyBell from './NotifyBell.vue';
import BtnIcon from './buttons/BtnIcon.vue';

export default {
  components: {
    NotifyBell,
    BtnClose,
    Logo,
    BackIcon,
    Bell,
    ThreeDots,
    Close,
    Truncate,
    BtnPlain,
    BtnIcon,
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
    modalHeader() {
      return this.$route.meta.modalHeader;
    },
    showBack() {
      return (
        (this.$route.meta.backButton !== undefined ? this.$route.meta.backButton : true)
        && this.title
      );
    },
    showMore() {
      return this.$route.name !== 'more' && !this.$route.meta?.closeButton;
    },
    showNotifications() {
      return this.$route.name !== 'notifications' && !this.$route.meta?.hideNotificationsIcon;
    },
    isLogoDisabled() {
      return this.$route.name === 'account';
    },
  },
  methods: {
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
  position: sticky;
  display: flex;
  align-items: center;
  justify-content: space-between;
  top: 0;
  z-index: variables.$z-index-header;
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
      @extend %face-sans-16-medium;

      padding: 0 4px;
      display: flex;
      justify-content: center;
      white-space: nowrap;
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

  &.modal-header {
    background-color: variables.$color-bg-modal;
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
      color: variables.$color-primary;
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
}
</style>
