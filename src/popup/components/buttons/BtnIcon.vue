<template>
  <BtnBase
    v-bind="$attrs"
    class="btn-icon"
    variant="muted"
    hollow
    :class="[
      `size-${size}`,
      `icon-variant-${iconVariant}`,
      {
        dimmed,
        loading,
      },
    ]"
    :disabled="loading"
  >
    <Badge
      class="badge"
      :text="badgeText"
    >
      <slot>
        <AnimatedPendingIcon
          v-if="loading"
        />
        <Component
          :is="icon"
          v-else-if="icon"
          class="icon"
        />
      </slot>
    </Badge>
  </BtnBase>
</template>

<script lang="ts">
import { Component, PropType, defineComponent } from 'vue';

import Badge from '@/popup/components/Badge.vue';
import BtnBase from '@/popup/components/buttons/BtnBase.vue';
import AnimatedPendingIcon from '@/icons/animated-pending.svg?vue-component';

const SIZES = ['sm', 'rg'] as const;
const VARIANTS = ['default', 'success', 'danger'] as const;

export default defineComponent({
  components: {
    BtnBase,
    Badge,
    AnimatedPendingIcon,
  },
  props: {
    icon: { type: Object as PropType<Component>, default: null },
    iconVariant: {
      type: String as PropType<typeof VARIANTS[number]>,
      default: 'default',
      validator: (val: any) => VARIANTS.includes(val),
    },
    size: {
      type: String as PropType<typeof SIZES[number]>,
      default: 'rg',
      validator: (val: any) => SIZES.includes(val),
    },
    badgeText: { type: [String, Number], default: null },
    dimmed: Boolean,
    loading: Boolean,
  },
});
</script>

<style lang="scss">
@use '@/styles/variables' as *;
@use '@/styles/mixins';

.btn-icon {
  --size: 24px;
  --icon-opacity: 0.75;
  --icon-opacity-hover: 1;
  --icon-color: #{$color-white};
  --icon-color-hover: #{$color-white};

  @include mixins.flex(center, center);

  padding: 4px;
  background: transparent;
  border: none;
  border-radius: 50%;
  outline: none;
  cursor: pointer;

  .badge {
    display: flex;
  }

  .icon {
    color: var(--icon-color);
    width: var(--size);
    height: var(--size);
    opacity: var(--icon-opacity);
    transition: $transition-interactive;
  }

  &:hover {
    transition-duration: 100ms;

    .icon {
      opacity: var(--icon-opacity-hover);
      color: var(--icon-color-hover);
    }
  }

  &:active {
    transform: scale(0.92);

    .icon {
      opacity: 1;
    }
  }

  &.dimmed {
    --icon-opacity: 0.5;
    --icon-opacity-hover: 0.75;
  }

  &.size {
    &-sm {
      --size: 20px;
    }
  }

  &.icon-variant {
    &-success {
      --icon-color: #{$color-success};
      --icon-color-hover: #{$color-success};
    }

    &-danger {
      --icon-color-hover: #{$color-danger};
    }
  }
}
</style>
