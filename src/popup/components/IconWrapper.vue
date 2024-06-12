<template>
  <div
    class="icon-wrapper"
    :class="[
      `icon-size-${iconSize}`,
      { 'is-boxed': isBoxed },
    ]"
  >
    <Component
      :is="icon"
      v-if="icon"
      class="icon-wrapper-icon"
      :class="{ 'icon-wrapper-fill': isFull }"
    />
    <ProtocolIcon
      v-else-if="protocolIcon"
      :protocol="protocolIcon"
      :icon-size="iconSize"
    />
  </div>
</template>

<script lang="ts">
import { Component, PropType, defineComponent } from 'vue';
import { Protocol } from '@/types';
import { ICON_SIZES } from '@/constants';

import ProtocolIcon from '@/popup/components/ProtocolIcon.vue';

const ALLOWED_ICON_SIZES = [ICON_SIZES.rg, ICON_SIZES.lg, ICON_SIZES.xl] as const;

type IconSize = typeof ALLOWED_ICON_SIZES[number];

export const iconSizeProp = {
  type: String as PropType<IconSize>,
  default: ICON_SIZES.lg,
  validator: (val: IconSize) => ALLOWED_ICON_SIZES.includes(val),
};

export const protocolIconProp = {
  type: String as PropType<Protocol>,
  default: null,
};

export default defineComponent({
  components: {
    ProtocolIcon,
  },
  props: {
    icon: { type: Object as PropType<Component>, default: null },
    isFull: Boolean,
    isBoxed: Boolean,
    iconSize: iconSizeProp,
    protocolIcon: protocolIconProp,
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.icon-wrapper {
  --wrapper-size: 36px;
  --icon-size: var(--icon-size-lg);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: $transition-interactive;

  .icon-wrapper-icon {
    width: var(--icon-size);
    height: var(--icon-size);
    color: inherit;
  }

  .icon-wrapper-fill {
    width: 100%;
    height: 100%;
  }

  &.is-boxed {
    width: var(--wrapper-size);
    height: var(--wrapper-size);
    background-color: rgba($color-white, 0.15);
    border-radius: 14px;
  }

  &.icon-size {
    &-xl {
      --icon-size: var(--icon-size-xl);
    }

    &-rg {
      --icon-size: var(--icon-size-rg);
    }
  }
}
</style>
