<template>
  <transition name="fade">
    <div
      v-if="isVisible"
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

<script>
import { mapGetters, mapState } from 'vuex';
import {
  NODE_STATUS_INIT_SERVICES,
  NODE_STATUS_CONNECTING,
  NODE_STATUS_CONNECTION_DONE,
  NODE_STATUS_CONNECTED,
  NODE_STATUS_ERROR,
  NODE_STATUS_OFFLINE,
} from '../utils';

export default {
  data() {
    return {
      statuses: {
        [NODE_STATUS_INIT_SERVICES]: this.$t('pages.nodeConnectionStatus.initServices'),
        [NODE_STATUS_CONNECTING]: this.$t('pages.nodeConnectionStatus.connecting'),
        [NODE_STATUS_CONNECTION_DONE]: this.$t('pages.nodeConnectionStatus.connected'),
        [NODE_STATUS_ERROR]: this.$t('pages.nodeConnectionStatus.error'),
        [NODE_STATUS_OFFLINE]: this.$t('pages.nodeConnectionStatus.offline'),
      },
    };
  },
  computed: {
    ...mapState(['nodeStatus']),
    ...mapGetters(['account', 'isConnected', 'isLoggedIn']),
    isVisible() {
      return (
        this.nodeStatus !== NODE_STATUS_CONNECTED
        && this.account.address
        && this.isLoggedIn
      );
    },
    isError() {
      return [
        NODE_STATUS_ERROR,
        NODE_STATUS_OFFLINE,
      ].includes(this.nodeStatus);
    },
    statusText() {
      return this.statuses[this.nodeStatus];
    },
  },
};
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
