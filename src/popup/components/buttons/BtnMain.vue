<template>
  <Component
    :is="component"
    v-bind="$attrs"
    class="btn-main"
    :to="to"
    :href="href"
    :target="(href) ? '_blank' : null"
    :class="[
      variant,
      {
        disabled,
        extend,
        half,
        third,
        inline,
        nowrap,
        'has-icon': hasIcon,
      },
    ]"
    v-on="$listeners"
  >
    <slot>{{ text }}</slot>
  </Component>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: {
    variant: {
      type: String,
      validator: (value: string) => [
        'primary',
        'secondary',
        'alternative',
        'danger',
        'pink',
        'purple',
      ].includes(value),
      default: 'primary',
    },
    text: { type: String, default: '' },
    to: { type: [Object, String], default: null },
    href: { type: String, default: null },
    disabled: Boolean,
    extend: Boolean,
    half: Boolean,
    third: Boolean,
    inline: Boolean,
    nowrap: Boolean,
    hasIcon: Boolean,
  },
  setup(props) {
    const component = computed((): string => {
      if (props.to) {
        return 'RouterLink';
      }
      if (props.href) {
        return 'a';
      }
      return 'button';
    });

    return {
      component,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.btn-main {
  --color: #{variables.$color-primary};

  @extend %face-sans-16-regular;

  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 0;
  width: fit-content;
  min-height: 40px;
  padding: 5px 16px;
  border-radius: variables.$border-radius-interactive;
  line-height: 20px;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  color: variables.$color-white;
  background-color: var(--color);
  user-select: none;
  cursor: pointer;
  transition: all 100ms;

  &::after {
    position: absolute;
    content: '';
    inset: 0;
    border-radius: inherit;
    background-color: var(--screen-bg-color);
    opacity: 0;
    will-change: opacity;
    transition: opacity 100ms;
  }

  &:hover {
    &::after {
      opacity: 0.2;
    }
  }

  &:active {
    &::after {
      opacity: 0.3;
    }
  }

  &.disabled {
    pointer-events: none;

    &::after {
      opacity: 0.6;
    }
  }

  &.secondary {
    --color: #{variables.$color-grey-medium};
  }

  &.alternative {
    --color: #{variables.$color-bg-6};
  }

  &.danger {
    --color: #{variables.$color-danger};
  }

  &.pink {
    --color: #{variables.$color-pink};
  }

  &.purple {
    --color: #{variables.$color-purple};
  }

  &.half {
    width: 48%;
    margin: 0;
    display: inline-block;
  }

  &.third {
    display: inline-block;
    width: 32%;
    margin: 0;
  }

  &.inline {
    display: inline-flex;
  }

  &.nowrap {
    white-space: nowrap;
  }

  &.has-icon {
    gap: 4px;

    ::v-deep .icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      color: inherit;
    }
  }

  &.extend {
    width: 100%;
  }
}
</style>
