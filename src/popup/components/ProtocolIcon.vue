<template>
  <component
    :is="selectedIcon"
    v-if="selectedIcon && !isSolanaImg"
    class="protocol-icon"
    :class="[iconSize]"
  />
  <img
    v-else-if="isSolanaImg"
    src="../../icons/coin/solana.svg"
    class="protocol-icon"
    :class="[iconSize]"
    alt="Solana"
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
    // Solana SVG relies on gradients and internal defs. When inlined as a Vue component,
    // its gradient/mask IDs or scoped styles can clash in some views (e.g. account-details),
    // leading to it rendering as a solid black circle. To avoid any style/ID interference,
    // we render Solana via <img>, which isolates it from page CSS and ensures consistent display.
    // We also prefix inlined SVG IDs via SVGO in vue.config.js for extra safety.
    const isSolanaImg = computed(() => props.protocol === PROTOCOLS.solana);

    return {
      selectedIcon,
      isSolanaImg,
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
