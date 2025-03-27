<template>
  <transition name="fade-transition">
    <div
      v-if="status"
      data-cy="connection-status"
      class="connection-status"
      :class="{
        'is-error': isError,
        'is-shrunk': isShrunk,
        'is-appeared': isAppeared,
      }"
    >
      <template v-if="!isShrunk">
        {{ status?.statusMessage }}
        <BtnHelp
          v-if="status?.title"
          :title="status.title"
          :msg="status.description"
          :icon="status.icon"
          :option="status.option"
          warning
          class="btn-help"
        />
        <BtnClose
          v-if="isError"
          class="button-close"
          @click="handleShrink()"
        />
      </template>
      <template v-else>
        <BtnIcon
          :icon="WarningOutlineIcon"
          icon-variant="warning"
          class="icon"
          @click="handleShrink()"
        />
      </template>
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { useConnectionStatus } from '@/composables/connectionStatus';

import BtnHelp from './buttons/BtnHelp.vue';
import BtnClose from './buttons/BtnClose.vue';
import BtnIcon from './buttons/BtnIcon.vue';
import WarningOutlineIcon from '../../icons/warning-outline.svg?vue-component';

export default defineComponent({
  components: {
    BtnClose,
    BtnHelp,
    BtnIcon,
  },
  setup() {
    const { isError, status } = useConnectionStatus();

    const isShrunk = ref(false);
    const isAppeared = ref(false);

    function handleShrink() {
      isShrunk.value = !isShrunk.value;
      isAppeared.value = true;
    }

    watch(
      status,
      () => {
        isShrunk.value = false;
        isAppeared.value = false;
      },
    );

    return {
      WarningOutlineIcon,
      isAppeared,
      isError,
      isShrunk,
      status,
      handleShrink,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.connection-status {
  @extend %face-sans-15-medium;

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  color: $color-white;
  backdrop-filter: blur($bg-blur-radius);
  text-align: center;
  width: 100%;
  right: 0;

  &.is-appeared {
    animation-name: grow;
    animation-duration: 0.3s;
  }

  &::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 0;
    background: $color-bg-3;
    opacity: 0.8;
  }

  @keyframes grow {
    from {
      margin-left: 100%;
      left: 0;
    }

    to {
      margin-left: 0%;
      left: 0;
    }
  }

  @keyframes shrink {
    from {
      width: 100%;
    }

    to {
      width: 10%;
    }
  }

  &.is-shrunk {
    left: unset;
    width: unset;
    animation-name: shrink;
    animation-duration: 0.3s;
    border-radius: 10px;

    &::before {
      border-radius: 10px;
    }
  }

  &.is-error {
    color: $color-warning;
  }

  .button-close {
    position: absolute;
    right: 4px;
  }

  .icon {
    height: 24px;
    width: 24px;
    cursor: pointer;
  }

  .btn-help {
    margin-left: 4px;
  }
}
</style>
