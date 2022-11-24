<template>
  <transition name="fade">
    <div
      v-if="isVisible"
      data-cy="connect-node"
      class="node-connection-status"
      :class="{
        'is-error': isNodeError,
      }"
    >
      Connecting or not connected
    </div>
  </transition>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { IAccount } from '../../types';
import { useGetter, useSdk } from '../../composables';
import {
  NODE_STATUS_INIT_SERVICES,
  NODE_STATUS_CONNECTING,
  NODE_STATUS_CONNECTION_DONE,
  NODE_STATUS_CONNECTED,
  NODE_STATUS_ERROR,
  NODE_STATUS_OFFLINE,
} from '../utils';

export default defineComponent({
  setup(props, { root }) {
    // const statuses = {
    //   [NODE_STATUS_INIT_SERVICES]: root.$t('pages.nodeConnectionStatus.initServices'),
    //   [NODE_STATUS_CONNECTING]: root.$t('pages.nodeConnectionStatus.connecting'),
    //   [NODE_STATUS_CONNECTION_DONE]: root.$t('pages.nodeConnectionStatus.connected'),
    //   [NODE_STATUS_ERROR]: root.$t('pages.nodeConnectionStatus.error'),
    //   [NODE_STATUS_OFFLINE]: root.$t('pages.nodeConnectionStatus.offline'),
    // };

    const account = useGetter<IAccount>('account');
    const isLoggedIn = useGetter('isLoggedIn');
    const { isNodeReady, isNodeConnecting, isNodeError } = useSdk();

    const isVisible = computed(() => (
      isLoggedIn.value
      && account.value.address
      && (!isNodeReady.value || isNodeConnecting.value)
    ));

    return {
      isNodeReady,
      isNodeConnecting,
      isVisible,
      isNodeError,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.node-connection-status {
  @extend %face-sans-15-medium;

  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 4px 10px;
  color: variables.$color-white;
  backdrop-filter: blur(variables.$bg-blur-radius);
  text-align: center;

  &::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 0;
    background: variables.$color-bg-3;
    opacity: 0.8;
  }

  &.is-error {
    color: variables.$color-warning;
  }
}
</style>
