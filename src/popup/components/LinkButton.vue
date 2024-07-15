<template>
  <a
    class="link-button"
    :class="[
      `variant-${variant}`,
      {
        underlined,
        'has-icon': isExternal || $slots.icon,
      },
    ]"
    :href="IS_MOBILE_APP ? undefined : href"
    rel="noopener noreferrer"
    target="_blank"
    @click="onClick"
  >
    <slot>{{ text }}</slot>

    <span
      v-if="isExternal || $slots.icon"
      class="link-icon"
    >
      <ExternalLinkIcon v-if="isExternal" />
      <slot
        v-else
        name="icon"
      />
    </span>
  </a>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { IS_MOBILE_APP } from '@/constants';

import ExternalLinkIcon from '@/icons/external-link.svg?vue-component';

export const LINK_BUTTON_VARIANT = [
  'default',
  'muted',
] as const;

export type LinkButtonVariant = typeof LINK_BUTTON_VARIANT[number];

export default defineComponent({
  components: {
    ExternalLinkIcon,
  },
  props: {
    text: { type: String, default: null },
    href: { type: String, required: true },
    underlined: Boolean,
    isExternal: Boolean,
    variant: {
      type: String as PropType<LinkButtonVariant>,
      validator: (value: LinkButtonVariant) => LINK_BUTTON_VARIANT.includes(value),
      default: LINK_BUTTON_VARIANT[0],
    },
  },
  setup(props) {
    async function onClick(event: any) {
      if (IS_MOBILE_APP) {
        event.preventDefault();
        window.open(props.href, '_system');
      }
    }

    return {
      IS_MOBILE_APP,
      onClick,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.link-button {
  color: $color-primary;

  &:hover {
    color: $color-primary-hover;

    .link-icon {
      svg {
        opacity: 1;
      }
    }
  }

  &:active {
    opacity: 0.7;

    .link-icon {
      svg {
        opacity: 0.7;
      }
    }
  }

  .link-icon {
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 24px;
      height: 24px;
      opacity: 0.44;
      color: $color-white;
    }
  }

  &.variant {
    &-muted {
      text-decoration: none;
      color: rgba($color-white, 0.75);

      .link-icon {
        svg {
          opacity: 1;
          color: rgba($color-white, 0.75);
        }
      }

      &:hover {
        color: $color-white;

        .link-icon {
          svg {
            color: $color-white;
          }
        }
      }
    }
  }

  &.has-icon {
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }

  &.underlined {
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
