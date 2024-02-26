<template>
  <BtnPill
    class="network-button"
    dense
    hollow
    @click.prevent="openNetworkSwitcherModal()"
  >
    <div
      class="circle"
      :class="{
        connected: isOnline && isAeNodeReady,
        error: !isOnline || isAeNodeError,
      }"
    />
    {{ activeNetwork.name }}
  </BtnPill>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { MODAL_NETWORK_SWITCHER } from '@/constants';
import {
  useConnection,
  useAeSdk,
  useNetworks,
  useModals,
} from '@/composables';

import BtnPill from './buttons/BtnPill.vue';

export default defineComponent({
  components: {
    BtnPill,
  },
  setup() {
    const { isOnline } = useConnection();
    const { activeNetwork } = useNetworks();
    const { openModal } = useModals();
    const { isAeNodeReady, isAeNodeError } = useAeSdk();

    function openNetworkSwitcherModal() {
      return openModal(MODAL_NETWORK_SWITCHER);
    }

    return {
      isOnline,
      isAeNodeReady,
      isAeNodeError,
      activeNetwork,
      openNetworkSwitcherModal,
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
