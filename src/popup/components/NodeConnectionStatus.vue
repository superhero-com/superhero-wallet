<template>
  <transition :name="isSettings ? 'from-settings-fade' : ''">
    <div
      v-if="isVisible"
      :data-cy="isError ? 'connect-node' : ''"
      class="node-connection-status"
      :class="{
        'from-settings': isSettings,
        'connect-error': isError && !isSettings,
      }"
    >
      {{ statuses[nodeStatus] }}
    </div>
  </transition>
</template>

<script>
import { mapGetters, mapState } from 'vuex';

export default {
  props: {
    isSettings: Boolean,
  },
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
    isVisible() {
      return this.nodeStatus && this.account.address && this.isLoggedIn && (this.isSettings || !this.$route.path.startsWith('/more/settings'));
    },
    isError() {
      return this.nodeStatus === 'error' || this.nodeStatus === 'offline';
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.node-connection-status {
  @extend %face-sans-14-regular;

  position: fixed;
  width: 100%;
  bottom: env(safe-area-inset-bottom);
  left: 0;
  right: 0;
  background: var(--screen-bg-color);
  padding: 4px 0;
  color: variables.$color-white;
  text-align: center;

  @include mixins.desktop {
    position: sticky;
  }

  &.from-settings {
    @extend %face-sans-14-medium;

    position: relative;
    pointer-events: none;
    user-select: none;
    padding-bottom: 8px;
    margin-top: 12px;
    height: 32px;
  }
}

.connect-error {
  font-weight: bold;
  background: variables.$color-blue;
}

.from-settings-fade {
  &-enter-active,
  &-leave-active {
    transition: opacity 150ms ease-in;
    opacity: 0.75;
  }

  &-enter,
  &-leave-to {
    opacity: 0;
  }
}

</style>
