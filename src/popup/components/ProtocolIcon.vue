<template>
  <!-- For EVM protocols, show multiple coin icons only when showSuperIcon is true -->
  <div
    v-if="isEvmProtocol && showSuperIcon"
    class="evm-protocol-icons"
    :class="[iconSize]"
  >
    <component
      v-for="(icon, index) in evmIcons.slice(0, maxVisibleIcons)"
      :key="index"
      :is="icon"
      class="protocol-icon"
      :class="[iconSize]"
      :style="{
        marginLeft: index > 0 ? '-10px' : '0',
        zIndex: maxVisibleIcons + 1 - index,
      }"
    />
    <span
      v-if="evmIcons.length > maxVisibleIcons"
      class="icon protocol-icon evm-more-indicator"
      :class="[iconSize]"
      :style="{
        marginLeft: '-10px',
        zIndex: 0,
      }"
    >
      &middot;&middot;&middot;
    </span>
  </div>

  <!-- For non-EVM protocols or when showSuperIcon is false, show single icon -->
  <component
    v-else-if="selectedIcon"
    :is="selectedIcon"
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
import { ICON_SIZES, PROTOCOLS, EVM_PROTOCOLS } from '@/constants';
import type { Protocol } from '@/types';
import { isEvm } from '@/utils';
import AeternityLogo from '@/icons/logo/aeternity.svg?vue-component';

import { COIN_ICONS } from './AssetIcon.vue';

const SIZES = [
  ICON_SIZES.xs,
  ICON_SIZES.md,
  ICON_SIZES.rg,
  ICON_SIZES.lg,
  ICON_SIZES.xl,
] as const;

export type AllowedProtocolIconSize = (typeof SIZES)[number];

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
    showSuperIcon: {
      type: Boolean,
      default: false,
    },
    maxVisibleIcons: {
      type: Number,
      default: 3,
      validator: (val: number) => val > 0,
    },
  },
  setup(props) {
    const iconsMap: Record<Protocol, Component> = {
      ...COIN_ICONS,
      [PROTOCOLS.aeternity]: AeternityLogo, // Override with logo version
    };

    const selectedIcon = computed((): Component => iconsMap[props.protocol]);

    const isEvmProtocol = computed((): boolean => isEvm(props.protocol));
    const evmIcons = computed((): Component[] => (
      EVM_PROTOCOLS.map((protocol) => iconsMap[protocol])
    ));

    return {
      selectedIcon,
      isEvmProtocol,
      evmIcons: evmIcons.value.concat(evmIcons.value),
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

.evm-protocol-icons {
  display: inline-flex;
  align-items: center;

  .protocol-icon {
    width: var(--icon-size-sm) !important;
    height: var(--icon-size-sm) !important;
  }

  .evm-more-indicator {
    font-weight: bold;
    color: #a3a3a3;
    background-color: #464646;
    border-radius: 50%;
    font-size: 12px;
    width: var(--icon-size-sm) !important;
    height: var(--icon-size-sm) !important;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
