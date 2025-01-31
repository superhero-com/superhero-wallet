<template>
  <transition name="fade-transition">
    <div
      v-if="status"
      data-cy="connection-status"
      class="connection-status"
      :class="{
        'is-error': isError,
      }"
    >
      {{ status?.statusMessage }}
      <BtnHelp
        v-if="status.title"
        :title="status.title"
        :msg="status.description"
        :icon="status.icon"
        warning
        class="btn-help"
      />
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useConnectionStatus } from '@/composables/connectionStatus';

import BtnHelp from './buttons/BtnHelp.vue';

export default defineComponent({
  components: { BtnHelp },
  setup() {
    const { isError, status } = useConnectionStatus();

    return {
      isError,
      status,
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
  min-height: 40px;
  padding: 0px 10px;
  color: $color-white;
  backdrop-filter: blur($bg-blur-radius);
  text-align: center;

  &::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 0;
    background: $color-bg-3;
    opacity: 0.8;
  }

  &.is-error {
    color: $color-warning;
  }

  .btn-help {
    margin-left: 4px;
  }
}
</style>
