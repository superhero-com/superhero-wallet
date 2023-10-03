<template>
  <a
    :class="['link-button', variant, { underlined }]"
    :href="IS_MOBILE_APP ? undefined : to"
    target="_blank"
    @click="onClick"
  >
    <slot />
    <span
      v-if="$slots.icon"
      class="link-icon"
    >
      <slot
        name="icon"
      />
    </span>
  </a>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { IS_MOBILE_APP } from '@/constants';

export const LINK_BUTTON_VARIANT = [
  'default',
  'muted',
  'simple',
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
  setup(props) {
    async function onClick(event: any) {
      if (IS_MOBILE_APP) {
        event.preventDefault();
        window.open(props.to, '_system');
      }
    }

    return {
      LINK_BUTTON_VARIANT,
      IS_MOBILE_APP,
      onClick,
    };
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

  &.default {
    color: variables.$color-success;
  }

  &.simple {
    gap: 0;
  }

  .link-icon {
    display: flex;
    align-items: center;
    justify-content: center;

    :deep(svg) {
      width: 24px;
      height: 24px;
      opacity: 0.44;
      color: variables.$color-white;
    }
  }

  &:hover {
    color: variables.$color-success-hover;

    .link-icon {
      svg {
        opacity: 1;
        color: variables.$color-success;
      }
    }
  }

  &:active {
    opacity: 0.7;

    .link-icon {
      svg {
        opacity: 0.7;
        color: variables.$color-success;
      }
    }
  }

  &.muted {
    text-decoration: none;
    color: rgba(variables.$color-white, 0.75);

    .link-icon {
      svg {
        opacity: 1;
        color: rgba(variables.$color-white, 0.75);
      }
    }

    &:hover {
      color: variables.$color-white;

      .link-icon {
        svg {
          color: variables.$color-white;
        }
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
