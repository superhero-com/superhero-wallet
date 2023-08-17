<template>
  <component
    :is="selectedIcon"
    v-if="selectedIcon"
    class="protocol-icon-wrapper"
  />
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
} from 'vue';
import {
  PROTOCOL_AETERNITY,
  PROTOCOL_BITCOIN,
} from '@/constants';
import AeternityIcon from '../../icons/coin/aeternity.svg?vue-component';
import BitcoinIcon from '../../icons/coin/bitcoin.svg?vue-component';

export default defineComponent({
  props: {
    protocol: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const selectedIcon = computed(() => {
      switch (props.protocol) {
        case PROTOCOL_AETERNITY: {
          return AeternityIcon;
        }
        case PROTOCOL_BITCOIN: {
          return BitcoinIcon;
        }
        default: {
          return null;
        }
      }
    });

    return {
      selectedIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
.protocol-icon-wrapper {
  display: inline-block;
  width: 20px;
  height: 20px;
}
</style>
