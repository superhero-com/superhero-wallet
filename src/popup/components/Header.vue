<template>
  <div
    class="header"
    :class="{
      'not-logged-in': !isLoggedIn,
    }"
  >
    <div
      v-if="isLoggedIn || titleTruncated"
      class="left"
    >
      <BtnIcon
        v-if="showHeaderNavigation"
        class="icon-btn"
        @click="back"
      >
        <BackIcon data-cy="back-arrow" />
      </BtnIcon>
      <Component
        :is="isLogoDisabled ? 'div' : 'RouterLink'"
        v-else-if="isLoggedIn"
        :to="isLogoDisabled ? null : { name: ROUTE_ACCOUNT }"
        :class="['home-button', { 'disabled': isLogoDisabled }]"
      >
        <Logo class="home-icon" />
      </Component>
    </div>

    <div
      class="title"
    >
      <Truncate
        :str="titleTruncated"
        class="text"
      />
    </div>

    <div
      v-if="isLoggedIn"
      class="right"
    >
      <BtnClose
        v-if="showHeaderNavigation"
        data-cy="close"
        @click="close"
      />
      <template v-else>
        <NotifyBell />

        <BtnIcon
          :to="{ name: ROUTE_MORE }"
          data-cy="page-more"
        >
          <ThreeDots />
        </BtnIcon>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { useGetter } from '../../composables';
import { WalletRouteMeta } from '../../types';
import {
  ROUTE_INDEX,
  ROUTE_ACCOUNT,
  ROUTE_MORE,
} from '../router/routeNames';
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

export default defineComponent({
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
  setup(props, { root }) {
    const isLoggedIn = useGetter('isLoggedIn');
    const currentHomeRouteName = computed(() => (isLoggedIn.value) ? ROUTE_ACCOUNT : ROUTE_INDEX);
    const routeMeta = computed(() => root.$route.meta as WalletRouteMeta);
    const showHeaderNavigation = computed(() => !!routeMeta.value?.showHeaderNavigation);
    const isLogoDisabled = computed(() => root.$route.name === ROUTE_ACCOUNT);
    const titleTruncated = computed(
      () => routeMeta.value?.title ? root.$t(`pages.titles.${routeMeta.value.title}`) : '',
    );

    function back() {
      if (root.$store.state.route.from.name === ROUTE_INDEX) {
        return root.$router.push({ name: currentHomeRouteName.value });
      }
      if (root.$route.meta?.backRoute) {
        // TODO: rewrite back button logic in more unified way
        return root.$router.push(root.$route.meta?.backRoute);
      }
      return root.$router.back();
    }

    function close() {
      root.$router.replace({ name: currentHomeRouteName.value });
    }

    return {
      ROUTE_ACCOUNT,
      ROUTE_MORE,
      isLoggedIn,
      showHeaderNavigation,
      isLogoDisabled,
      titleTruncated,
      back,
      close,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.header {
  position: absolute;
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
