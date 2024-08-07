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
import { ICON_SIZES, PROTOCOLS } from '@/constants';
import type { Protocol } from '@/types';

import AeternityLogo from '@/icons/logo/aeternity.svg?vue-component';
import BitcoinIcon from '@/icons/coin/bitcoin.svg?vue-component';
import EthereumIcon from '@/icons/coin/ethereum.svg?vue-component';
import SolanaIcon from '@/icons/coin/solana.svg?vue-component';

const SIZES = [ICON_SIZES.xs, ICON_SIZES.md, ICON_SIZES.rg, ICON_SIZES.lg, ICON_SIZES.xl] as const;

export type AllowedProtocolIconSize = typeof SIZES[number];

export default defineComponent({
  props: {
    protocol: {
      type: String as PropType<Protocol>,
      required: true,
    },
    iconSize: {
      type: String as PropType<AllowedProtocolIconSize>,
      default: ICON_SIZES.md,
      validator: (val: AllowedProtocolIconSize) => SIZES.includes(val),
    },
  },
  setup(props) {
    const iconsMap: Record<Protocol, Component> = {
      [PROTOCOLS.aeternity]: AeternityLogo,
      [PROTOCOLS.bitcoin]: BitcoinIcon,
      [PROTOCOLS.ethereum]: EthereumIcon,
      [PROTOCOLS.solana]: SolanaIcon,
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
  --icon-size: var(--icon-size-md);

  display: inline-block;
  width: var(--icon-size);
  height: var(--icon-size);

  &.xs {
    --icon-size: var(--icon-size-xs);
  }

  &.rg {
    --icon-size: var(--icon-size-rg);
  }

  &.lg {
    --icon-size: var(--icon-size-lg);
  }

  &.xl {
    --icon-size: var(--icon-size-xl);
  }
}
</style>
