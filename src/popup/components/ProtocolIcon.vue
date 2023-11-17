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
  Component,
  computed,
  defineComponent,
  PropType,
} from 'vue';
import { PROTOCOLS } from '@/constants';
import type { Protocol } from '@/types';
import AeternityIcon from '@/icons/coin/aeternity.svg?vue-component';
import AeternityLogo from '@/icons/logo/aeternity.svg?vue-component';
import BitcoinIcon from '@/icons/coin/bitcoin.svg?vue-component';
import EthereumIcon from '@/icons/coin/ethereum.svg?vue-component';

const SIZES = ['sm', 'rg'] as const;

export type AllowedProtocolIconSize = typeof SIZES[number];

export default defineComponent({
  props: {
    protocol: {
      type: String as PropType<Protocol>,
      required: true,
    },
    iconSize: {
      type: String as PropType<AllowedProtocolIconSize>,
      default: 'rg',
      validator: (val: AllowedProtocolIconSize) => SIZES.includes(val),
    },
    isLogoIcon: { type: Boolean, default: false },
  },
  setup(props) {
    const iconsMap: Record<Protocol, Component> = {
      [PROTOCOLS.aeternity]:
        props.isLogoIcon
          ? AeternityLogo
          : AeternityIcon,
      [PROTOCOLS.bitcoin]: BitcoinIcon,
      [PROTOCOLS.ethereum]: EthereumIcon,
    };

    const selectedIcon = computed((): Component => iconsMap[props.protocol]);

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
