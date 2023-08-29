<template>
  <BtnPill
    class="network-button"
    with-hover-effects
    dense
    hollow
    @click.prevent="openNetworkSwitcherModal()"
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
    const store = useStore();
    const { isOnline } = useConnection();
    const { activeNetwork } = useNetworks();
    const { openModal } = useModals();
    const { isNodeReady, isNodeError } = useAeSdk({ store });

    function openNetworkSwitcherModal() {
      return openModal(MODAL_NETWORK_SWITCHER);
    }

    return {
      isOnline,
      isNodeReady,
      isNodeError,
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
