<template>
  <a
    :class="['link-button', variant, { underlined }]"
    :href="to"
    target="blank"
  >
    <slot />
  </a>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export const LINK_BUTTON_VARIANT = [
  'default',
  'muted',
] as const;

export type LinkButtonVariant = typeof LINK_BUTTON_VARIANT[number];

export default defineComponent({
  props: {
    to: { type: String, required: true },
    underlined: Boolean,
    variant: {
      type: String,
      validator: (value: LinkButtonVariant) => LINK_BUTTON_VARIANT.includes(value),
      default: LINK_BUTTON_VARIANT[0],
    },
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.link-button {
  @extend %face-sans-14-regular;

  padding: 0;
  display: inline-flex;
  gap: 4px;
  align-items: center;
  color: variables.$color-success;

  :deep(svg) {
    width: 24px;
    height: 24px;
    opacity: 0.44;
    color: variables.$color-white;
  }

  &:hover {
    color: variables.$color-success-hover;

    svg {
      opacity: 1;
      color: variables.$color-success;
    }
  }

  &:active {
    opacity: 0.7;

    svg {
      opacity: 0.7;
      color: variables.$color-success;
    }
  }

  &.muted {
    text-decoration: none;
    color: rgba(variables.$color-white, 0.75);

    svg {
      opacity: 1;
      color: rgba(variables.$color-white, 0.75);
    }

    &:hover {
      color: variables.$color-white;

      svg {
        color: variables.$color-white;
      }
    }
  }

  &.underlined {
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
