<template>
  <transition name="fade-transition">
    <div
      v-if="statusText"
      data-cy="connect-node"
      class="node-connection-status"
      :class="{
        'is-error': isError,
      }"
    >
      {{ statusText }}
    </div>
  </transition>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  watch,
} from 'vue';
import { TranslateResult, useI18n } from 'vue-i18n';
import { useAccounts, useConnection, useAeSdk } from '@/composables';

const CONNECTED_DISPLAY_TIME = 2000;

export default defineComponent({
  setup() {
    const { t } = useI18n();

    const { isOnline } = useConnection();
    const { isAeNodeConnecting, isAeNodeReady, isAeNodeError } = useAeSdk();
    const { isLoggedIn } = useAccounts();

    const justBeenConnected = ref(false);

    const isError = computed(() => !isOnline.value || isAeNodeError.value);

    // Display "Connected" message for a while after connecting to node.
    watch(isAeNodeReady, (val) => {
      justBeenConnected.value = val;
      if (val) {
        setTimeout(() => {
          justBeenConnected.value = false;
        }, CONNECTED_DISPLAY_TIME);
      }
    });

    const statusText = computed((): TranslateResult | null => {
      switch (true) {
        case !isOnline.value:
          return t('connectionStatus.offline');
        case !isLoggedIn.value:
          return null;
        case isAeNodeConnecting.value:
          return t('connectionStatus.node.connecting');
        case justBeenConnected.value:
          return t('connectionStatus.node.connected');
        case isAeNodeError.value:
          return t('connectionStatus.node.error');
        default:
          return null;
      }
    });

    return {
      isError,
      statusText,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.node-connection-status {
  @extend %face-sans-15-medium;

  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 4px 10px;
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
}
</style>
