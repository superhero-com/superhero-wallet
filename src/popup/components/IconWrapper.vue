<template>
  <div
    class="icon-wrapper"
    :class="[
      `icon-size-${iconSize}`,
      { 'is-boxed': isBoxed }
    ]"
  >
    <Component
      :is="icon"
      v-if="icon"
      class="icon-wrapper-icon"
      :class="{'icon-wrapper-fill': isFull}"
    />
    <ProtocolIcon
      v-else-if="protocolIcon"
      :protocol="protocolIcon"
    />
  </div>
</template>

<script lang="ts">
import { Component, PropType, defineComponent } from 'vue';
import ProtocolIcon from '@/popup/components/ProtocolIcon.vue';

const ALLOWED_ICON_SIZES = ['rg', 'lg'] as const;

type IconSize = typeof ALLOWED_ICON_SIZES[number];

export const iconSizeProp = {
  type: String as PropType<IconSize>,
  default: 'rg',
  validator: (val: IconSize) => ALLOWED_ICON_SIZES.includes(val),
};

export const protocolIconProp = {
  type: String,
  default: null,
};

export default defineComponent({
  components: {
    ProtocolIcon,
  },
  props: {
    icon: { type: Object as PropType<Component>, default: null },
    isFull: { type: Boolean, default: false },
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
  --icon-size: 24px; // rg

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
    &-lg {
      --icon-size: 28px;
    }
  }
}
</style>
