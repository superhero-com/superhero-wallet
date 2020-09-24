<template>
  <div>
    <div class="connect-error" v-if="nodeStatus == 'error' && account.publicKey && isLoggedIn">
      {{ $t('pages.nodeConnectionStatus.error') }}
    </div>
    <div
      class="connect-node"
      data-cy="connect-node"
      v-if="nodeStatus == 'connecting' && account.publicKey && isLoggedIn"
    >
      {{ $t('pages.nodeConnectionStatus.connecting') }}
    </div>
    <div
      class="connect-node"
      data-cy="connect-node"
      v-if="nodeStatus == 'connected' && account.publicKey && isLoggedIn"
    >
      {{ $t('pages.nodeConnectionStatus.connected') }}
    </div>
    <div
      class="connect-node"
      data-cy="connect-node"
      v-if="nodeStatus == 'initServices' && account.publicKey && isLoggedIn"
    >
      {{ $t('pages.nodeConnectionStatus.init') }}
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';

export default {
  computed: {
    ...mapState(['nodeStatus', 'isLoggedIn']),
    ...mapGetters(['account']),
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

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
