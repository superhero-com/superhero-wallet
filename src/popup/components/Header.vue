<template>
  <div
    class="page-header"
    :class="{
      'not-logged-in': !isLoggedIn,
    }"
  >
    <div
      v-if="isLoggedIn || text"
      class="left"
    >
      <BtnIcon
        class="icon-btn"
        data-cy="back-arrow"
        :icon="BackIcon"
        @click="back"
      />
    </div>

    <div
      class="title"
    >
      <Truncate
        :str="text"
        class="text"
      />
    </div>

    <div class="right">
      <BtnClose
        key="btn-close"
        data-cy="btn-close"
        class="btn-close"
        @click="close"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { usePageNavigation } from '@/composables';

import BackIcon from '@/icons/back.svg?vue-component';

import Truncate from './Truncate.vue';
import BtnClose from './buttons/BtnClose.vue';
import BtnIcon from './buttons/BtnIcon.vue';

export default defineComponent({
  components: {
    BtnClose,
    Truncate,
    BtnIcon,
  },
  props: {
    text: { type: String, default: null },
  },
  setup() {
    const {
      isLoggedIn,
      navigateBack,
      navigateHome,
    } = usePageNavigation();

    return {
      BackIcon,
      isLoggedIn,
      back: navigateBack,
      close: navigateHome,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: $header-default-height;
  padding: 0 8px;

  .left {
    display: flex;
  }

  .right {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .title {
    .text {
      @extend %face-sans-16-medium;

      padding: 0 4px;
      display: flex;
      justify-content: center;
      white-space: nowrap;
      line-height: 24px;
      color: $color-white;
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
}
</style>
