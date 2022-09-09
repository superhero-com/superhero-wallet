<template>
  <div
    v-if="nodeStatus && account.address && isLoggedIn"
    :data-cy="nodeStatus !== 'error' ? 'connect-node' : ''"
    class="node-connection-status"
    :class="`connect-${nodeStatus === 'error' || nodeStatus === 'offline' ? 'error' : 'node'}`"
  >
    {{ statuses[nodeStatus] }}
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';

export default {
  data() {
    return {
      statuses: {
        initServices: this.$t('pages.nodeConnectionStatus.initServices'),
        connecting: this.$t('pages.nodeConnectionStatus.connecting'),
        connected: this.$t('pages.nodeConnectionStatus.connected'),
        error: this.$t('pages.nodeConnectionStatus.error'),
        offline: this.$t('pages.nodeConnectionStatus.offline'),
      },
    };
  },
  computed: {
    ...mapState(['nodeStatus']),
    ...mapGetters(['account', 'isLoggedIn']),
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.node-connection-status,
.connect-error,
.connect-node {
  position: fixed;
  width: 100%;

  @include mixins.desktop {
    position: sticky;
  }

  bottom: env(safe-area-inset-bottom);
  left: 0;
  right: 0;
  background: variables.$color-bg-3-new;
  padding: 4px 0;
  color: variables.$color-white;
  text-align: center;

  @extend %face-sans-14-regular;
}

.connect-error {
  font-weight: bold;
  background: variables.$color-blue;
}
</style>
