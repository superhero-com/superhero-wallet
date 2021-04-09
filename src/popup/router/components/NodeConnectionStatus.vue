<template>
  <div
    v-if="nodeStatus && account.address && isLoggedIn"
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
    ...mapState(['nodeStatus']),
    ...mapGetters(['account', 'isLoggedIn']),
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/mixins';

.connect-error,
.connect-node {
  position: fixed;
  width: 100%;

  @include desktop {
    position: sticky;
  }

  bottom: 48px;
  left: 0;
  right: 0;
  background: $secondary-color;
  color: $white-color;
  line-height: 2em;
  padding-bottom: env(safe-area-inset-bottom);
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
