<template>
  <div
    v-if="nodeStatus && account.publicKey && isLoggedIn"
    :data-cy="nodeStatus !== 'error' ? 'connect-node' : ''"
    :class="`connect-${nodeStatus === 'error' ? 'error' : 'node'}`"
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
      },
    };
  },
  computed: {
    ...mapState(['nodeStatus', 'isLoggedIn']),
    ...mapGetters(['account']),
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.connect-error,
.connect-node {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $secondary-color;
  color: $white-color;
  padding: 0.3rem;
  padding-bottom: calc(0.3rem + env(safe-area-inset-bottom));
  z-index: 5;
  text-align: center;
  font-size: 14px;
}

.connect-error {
  font-weight: bold;
}

.connect-node {
  background: $nav-bg-color;
}
</style>
