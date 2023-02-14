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
      :class="[nodeStatus]"
    />
    {{ activeNetwork.name }}
  </BtnPill>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useGetter, useState } from '../../composables/vuex';
import { ROUTE_NETWORK_SETTINGS } from '../router/routeNames';
import type { INetwork } from '../../types';

import BtnPill from './buttons/BtnPill.vue';

export default defineComponent({
  components: {
    BtnPill,
  },
  setup() {
    const nodeStatus = useState('nodeStatus');
    const activeNetwork = useGetter<INetwork>('activeNetwork');

    return {
      activeNetwork,
      nodeStatus,
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
