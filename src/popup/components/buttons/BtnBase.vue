<template>
  <Component
    v-bind="$attrs"
    :is="component"
    :to="to"
    :href="href"
    :target="href ? '_blank' : null"
    :aria-disabled="disabled ? 'true' : null"
    :style="bgColorStyle"
    :type="submit ? 'submit' : null"
    :class="[
      `variant-${variant}`,
      {
        disabled,
        hollow,
        outlined,
        selected,
      }
    ]"
    class="btn-base"
    @click="onClick"
  >
    <slot />
  </Component>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';

import { IS_MOBILE_APP } from '@/constants';

export const BTN_VARIANT = [
  'primary',
  'secondary',
  'muted',
  'danger',
  'purple',
  'dark',
] as const;

export type BtnVariant = typeof BTN_VARIANT[number];

export const btnBaseProps = {
  to: { type: [Object, String], default: null },
  href: { type: String, default: null },
  variant: {
    type: String,
    validator: (value: BtnVariant) => BTN_VARIANT.includes(value),
    default: BTN_VARIANT[0],
  },
  bgColor: { type: String, default: null },
  submit: Boolean,
  disabled: Boolean,
  hollow: Boolean,
  outlined: Boolean,
  selected: Boolean,
};

export default defineComponent({
  props: btnBaseProps,
  setup(props) {
    const component = computed(() => {
      switch (true) {
        case !!props.to: return 'RouterLink';
        case !!props.href: return 'a';
        default: return 'button';
      }
    });

    function onClick(event: any) {
      if (IS_MOBILE_APP && window.cordova?.InAppBrowser?.open && props.href) {
        window.cordova.InAppBrowser.open(props.href, '_system');
        event.preventDefault();
      }
    }

    const bgColorStyle = computed(() => props.bgColor ? { '--bg-color': props.bgColor } : null);

    return {
      IS_MOBILE_APP,
      onClick,
      component,
      bgColorStyle,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.btn-base {
  --bg-color: #{$color-primary};
  --outline-size: 0;
  --outline-opacity: 0;
  --outline-color: transparent;

  position: relative;
  z-index: 1;
  background-color: var(--bg-color);
  color: $color-white;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  transition: $transition-interactive;

  &::before,
  &::after {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 0;
    border-radius: inherit;
    transition: $transition-interactive;
    will-change: opacity, box-shadow, background-color;
  }

  // The background layer
  &::before {
    background-color: var(--screen-bg-color);
    opacity: 0;
  }

  // The outline layer
  &::after {
    opacity: var(--outline-opacity);
    box-shadow: inset 0 0 0 var(--outline-size) var(--outline-color);
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

  &.outlined {
    --outline-color: #{$color-white};
    --outline-size: 1px;
    --outline-opacity: 0.2;

    &:hover {
      --outline-opacity: 0.3;
    }

    &:active {
      --outline-size: 2px;
    }
  }

  &.selected {
    --outline-color: #{$color-white};
    --outline-size: 1px;
    --outline-opacity: 0.2;

    &::before {
      opacity: 0.6;
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
