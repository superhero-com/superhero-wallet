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

<script>
import AnimatedPendingIcon from '@/icons/animated-pending.svg?vue-component';
import Badge from '../Badge.vue';
import BtnBase from './BtnBase.vue';

const SIZES = ['sm', 'rg'];
const VARIANTS = ['default', 'light', 'dimmed', 'danger'];

export default {
  components: {
    BtnBase,
    Badge,
    AnimatedPendingIcon,
  },
  props: {
    icon: { type: Object, default: null },
    iconVariant: {
      type: String,
      default: 'default',
      validator: (val) => VARIANTS.includes(val),
    },
    size: {
      type: String,
      default: 'rg',
      validator: (val) => SIZES.includes(val),
    },
    badgeText: { type: [String, Number], default: null },
    dimmed: Boolean,
    loading: Boolean,
  },
};
</script>

<style lang="scss">
@use '../../../styles/variables' as *;
@use '../../../styles/mixins';

.btn-icon {
  --size: 24px;
  --icon-opacity: 0.75;
  --icon-opacity-hover: 1;
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
    color: $color-white;
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
    &-danger {
      --icon-color-hover: #{$color-danger};
    }
  }
}
</style>
