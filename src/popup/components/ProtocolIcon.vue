<template>
  <component
    :is="selectedIcon"
    v-if="selectedIcon"
    class="protocol-icon"
    :class="[iconSize]"
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
import AeternityIcon from '@/icons/coin/aeternity.svg?vue-component';
import BitcoinIcon from '@/icons/coin/bitcoin.svg?vue-component';

const SIZES = ['sm', 'rg'] as const;

export type AllowedProtocolIconSize = typeof SIZES[number];

export default defineComponent({
  props: {
    protocol: {
      type: String,
      required: true,
    },
    iconSize: {
      type: String,
      default: 'rg',
      validator: (val: AllowedProtocolIconSize) => SIZES.includes(val),
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
.protocol-icon {
  --icon-size: 20px;

  display: inline-block;
  width: var(--icon-size);
  height: var(--icon-size);

  &.sm {
    --icon-size: 12px;
  }
}
</style>
