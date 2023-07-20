<template>
  <BtnPill
    :to="{ name: ROUTE_NETWORK_SETTINGS }"
    class="network-button"
    with-hover-effects
    dense
    hollow
  >
    <div
      class="circle"
      :class="{
        connected: isOnline && isNodeReady,
        error: !isOnline || isNodeError,
      }"
    />
    {{ activeNetwork.name }}
  </BtnPill>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from 'vuex';
import type { INetwork } from '../../types';
import { useGetter } from '../../composables/vuex';
import { useConnection, useAeSdk } from '../../composables';
import { ROUTE_NETWORK_SETTINGS } from '../router/routeNames';

import BtnPill from './buttons/BtnPill.vue';

export default defineComponent({
  components: {
    BtnPill,
  },
  setup() {
    const store = useStore();
    const { isOnline } = useConnection();
    const { isNodeReady, isNodeError } = useAeSdk({ store });
    const activeNetwork = useGetter<INetwork>('activeNetwork');

    return {
      isOnline,
      isNodeReady,
      isNodeError,
      activeNetwork,
      ROUTE_NETWORK_SETTINGS,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

.network-button {
  .circle {
    width: 6px;
    height: 6px;
    border-radius: 100%;
    background-color: variables.$color-warning;

    &.connected {
      background-color: variables.$color-success-dark;
    }

    &.error {
      background-color: variables.$color-danger;
    }
  }
}
</style>
