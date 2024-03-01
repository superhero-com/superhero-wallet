<template>
  <component
    :is="selectedIcon"
    v-if="selectedIcon"
    class="asset-icon"
    :class="[iconSize]"
  />
  <div v-else-if="$slots.fallback">
    <slot name="fallback" />
  </div>
</template>

<script lang="ts">
import {
  Component,
  computed,
  defineComponent,
  PropType,
} from 'vue';
import { Dictionary, Protocol } from '@/types';
import { ICON_SIZES, PROTOCOLS } from '@/constants';

import AeternityIcon from '@/icons/coin/aeternity.svg?vue-component';
import BitcoinIcon from '@/icons/coin/bitcoin.svg?vue-component';
import EthereumIcon from '@/icons/coin/ethereum.svg?vue-component';
import LexonTokenIcon from '@/icons/tokens/ct_xtk8rSz9suPb6D6VLquyfVji25FcnFRDjn3dnn5mmvHsPiESt.svg?vue-component';
import ChainlinkTokenIcon from '@/icons/tokens/0x779877a7b0d9e8603169ddbd7836e478b4624789.svg?vue-component';

const SIZES = [ICON_SIZES.sm, ICON_SIZES.rg, ICON_SIZES.md, ICON_SIZES.lg] as const;

const COIN_ICONS: Record<Protocol, Component> = {
  [PROTOCOLS.aeternity]: AeternityIcon,
  [PROTOCOLS.bitcoin]: BitcoinIcon,
  [PROTOCOLS.ethereum]: EthereumIcon,
};

const ASSET_ICONS: Dictionary<Component> = {
  ...COIN_ICONS,
  ct_xtk8rSz9suPb6D6VLquyfVji25FcnFRDjn3dnn5mmvHsPiESt: LexonTokenIcon,
  '0x779877a7b0d9e8603169ddbd7836e478b4624789': ChainlinkTokenIcon,
};

export type AllowedAssetIconSize = typeof SIZES[number];

export default defineComponent({
  props: {
    contractId: {
      type: String,
      required: true,
    },
    iconSize: {
      type: String as PropType<AllowedAssetIconSize>,
      default: ICON_SIZES.md,
      validator: (val: AllowedAssetIconSize) => SIZES.includes(val),
    },
  },
  setup(props) {
    const selectedIcon = computed(() => ASSET_ICONS[props.contractId]);

    return {
      selectedIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
.asset-icon {
  --icon-size: var(--icon-size-md);

  display: inline-block;
  width: var(--icon-size);
  height: var(--icon-size);

  &.rg {
    --icon-size: var(--icon-size-rg);
  }

  &.lg {
    --icon-size: var(--icon-size-lg);
  }
}
</style>
