<template>
  <Component
    v-bind="$attrs"
    :is="component"
    :to="to"
    :href="href"
    :target="href ? '_blank' : null"
    :aria-disabled="disabled ? 'true' : null"
    :style="bgColorStyle"
    :class="[
      `variant-${variant}`,
      {
        disabled,
        hollow,
      }
    ]"
    class="btn-base"
  >
    <slot />
  </Component>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';

export const BTN_VARIANT = [
  'primary',
  'secondary',
  'muted',
  'danger',
  'purple',
  'dark',
] as const;

export type BtnVariant = typeof BTN_VARIANT[number];

export default defineComponent({
  props: {
    to: { type: [Object, String], default: null },
    href: { type: String, default: null },
    variant: {
      type: String,
      validator: (value: BtnVariant) => BTN_VARIANT.includes(value),
      default: BTN_VARIANT[0],
    },
    bgColor: { type: String, default: null },
    disabled: Boolean,
    hollow: Boolean,
  },
  setup(props) {
    const component = computed(() => {
      switch (true) {
        case !!props.to: return 'RouterLink';
        case !!props.href: return 'a';
        default: return 'button';
      }
    });

    const bgColorStyle = computed(() => props.bgColor ? { '--bg-color': props.bgColor } : null);

    return {
      component,
      bgColorStyle,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables' as *;

.btn-base {
  --bg-color: #{$color-primary};

  position: relative;
  z-index: 1;
  background-color: var(--bg-color);
  color: $color-white;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  transition: $transition-interactive;

  &::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 0;
    border-radius: inherit;
    background-color: var(--screen-bg-color);
    transition: $transition-interactive;
    opacity: 0;
    will-change: opacity;
  }

  &:hover {
    &::before {
      opacity: 0.2;
    }
  }

  &:active {
    &::before {
      opacity: 0.3;
    }
  }

  &.disabled {
    pointer-events: none;
    color: rgba($color-white, 0.4);

    &::before {
      opacity: 0.6;
    }
  }

  &.hollow {
    &:not(:hover) {
      background-color: transparent;
    }
  }

  &.variant {
    &-secondary {
      --bg-color: #{$color-secondary};
    }

    &-muted {
      --bg-color: #{$color-grey-medium};
    }

    &-danger {
      --bg-color: #{$color-danger};
    }

    &-purple {
      --bg-color: #{$color-purple};
    }

    &-dark {
      --bg-color: #{$color-bg-6};
    }
  }
}
</style>
