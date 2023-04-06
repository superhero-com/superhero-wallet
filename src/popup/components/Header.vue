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
        data-cy="back-arrow"
        :icon="BackIcon"
        @click="back"
      />
      <Component
        :is="isLogoDisabled ? 'div' : 'RouterLink'"
        v-else-if="isLoggedIn"
        :to="isLogoDisabled ? null : { name: homeRouteName }"
        :class="['home-button', { 'disabled': isLogoDisabled }]"
      >
        <Logo class="home-icon" />
      </Component>
    </div>

    <div
      v-if="showHeaderNavigation"
      class="title"
    >
      <Truncate
        :str="titleTruncated"
        class="text"
      />
    </div>

    <div class="right">
      <BtnClose
        v-if="showHeaderNavigation"
        data-cy="close"
        @click="close"
      />
      <template v-else>
        <NetworkButton />

        <template v-if="isLoggedIn">
          <NotificationsIcon />

          <BtnIcon
            :to="{ name: ROUTE_MORE }"
            :icon="ThreeDotsIcon"
            data-cy="page-more"
          />
        </template>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { useGetter } from '../../composables/vuex';
import { WalletRouteMeta } from '../../types';
import {
  ROUTE_ACCOUNT,
  ROUTE_INDEX,
  ROUTE_MORE,
} from '../router/routeNames';
import Logo from '../../icons/logo-small.svg?vue-component';
import BackIcon from '../../icons/back.svg?vue-component';
import ThreeDotsIcon from '../../icons/three-dots.svg?vue-component';
import Truncate from './Truncate.vue';
import BtnClose from './buttons/BtnClose.vue';
import BtnPlain from './buttons/BtnPlain.vue';
import NotificationsIcon from './NotificationsIcon.vue';
import BtnIcon from './buttons/BtnIcon.vue';
import NetworkButton from './NetworkButton.vue';
import { useUi } from '../../composables';

export default defineComponent({
  components: {
    NetworkButton,
    NotificationsIcon,
    BtnClose,
    BtnPlain,
    Logo,
    Truncate,
    BtnIcon,
  },
  setup(props, { root }) {
    const { homeRouteName } = useUi({ store: root.$store });

    const isLoggedIn = useGetter('isLoggedIn');

    const currentHomeRouteName = computed(
      () => isLoggedIn.value
        ? homeRouteName.value
        : ROUTE_INDEX,
    );
    const routeMeta = computed(() => root.$route.meta as WalletRouteMeta);
    const showHeaderNavigation = computed(() => !!routeMeta.value?.showHeaderNavigation);
    const isLogoDisabled = computed(() => root.$route.name === ROUTE_ACCOUNT);
    const titleTruncated = computed(
      () => routeMeta.value?.title ? root.$t(`pages.titles.${routeMeta.value.title}`) : '',
    );

    function back() {
      const { fullPath, meta } = root.$route;
      const { directBackRoute, backRoute } = meta || {};

      if (directBackRoute) {
        return root.$router.go(-1);
      }
      if (backRoute) {
        // TODO: rewrite back button logic in more unified way
        return root.$router.push(backRoute);
      }
      const path = fullPath.endsWith('/') ? fullPath.slice(0, -1) : fullPath;

      return root.$router.push(
        path.substr(0, path.lastIndexOf('/')) || { name: currentHomeRouteName.value },
      );
    }

    function close() {
      root.$router.replace({ name: currentHomeRouteName.value });
    }

    return {
      homeRouteName,
      BackIcon,
      ThreeDotsIcon,
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

    .home-button {
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
  }

  .right {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
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

    &:only-child {
      flex-grow: 2;
      margin-left: 8px;
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

  .home-button + .back {
    margin-left: 22px;
  }
}
</style>
