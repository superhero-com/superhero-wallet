<template>
  <BtnPill
    class="network-button"
    dense
    hollow
    :variant="variant"
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
import { defineComponent, PropType } from 'vue';
import { MODAL_NETWORK_SWITCHER } from '@/constants';
import {
  useConnection,
  useAeSdk,
  useNetworks,
  useModals,
} from '@/composables';

import { BtnVariant } from './buttons/BtnBase.vue';
import BtnPill from './buttons/BtnPill.vue';

export default defineComponent({
  components: {
    BtnPill,
  },
  props: {
    variant: { type: String as PropType<BtnVariant>, default: 'primary' },
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
@use '@/styles/variables' as *;

.network-button {
  white-space: nowrap;

  .circle {
    width: 6px;
    height: 6px;
    border-radius: 100%;
    background-color: $color-warning;

    &.connected {
      background-color: $color-success-dark;
    }

    &.error {
      background-color: $color-danger;
    }
  }
}
</style>
