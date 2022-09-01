<template>
  <Component
    :is="component"
    v-bind="{
      ...$attrs,
      ...(component === 'a' ? { href: to, target: '_blank' } : { to }),
    }"
    class="button"
    :class="[
      fill,
      {
        disabled,
        extend,
        half,
        small,
        third,
        inline,
        inactive,
        hollow,
        nowrap,
        'has-icon': hasIcon,
        'new-ui': newUi,
      },
    ]"
    :type="submit ? 'submit' : null"
    v-on="$listeners"
  >
    <slot>{{ text }}</slot>
  </Component>
</template>

<script>
export default {
  props: {
    fill: {
      type: String,
      validator: (value) => ['primary', 'secondary', 'alternative'].includes(value),
      default: 'primary',
    },
    text: { type: String, default: '' },
    disabled: Boolean,
    extend: Boolean,
    half: Boolean,
    small: Boolean,
    third: Boolean,
    inline: Boolean,
    inactive: Boolean,
    nowrap: Boolean,
    to: { type: [String, Object], default: null },
    backgroundless: Boolean,
    hasIcon: Boolean,
    hollow: Boolean,
    newUi: Boolean,
    submit: Boolean,
  },
  computed: {
    isLinkOnSameHost() {
      return (
        typeof this.to === 'object'
        || new URL(this.to, window.location).host === window.location.host
      );
    },
    component() {
      if (!this.to) return 'button';
      if (this.isLinkOnSameHost) return 'RouterLink';
      return 'a';
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.button {
  @extend %face-sans-16-regular;

  display: block;
  position: relative;
  text-decoration: none;
  width: 280px;
  border-radius: 6px;
  padding: 0;
  margin: 8px auto;
  color: variables.$color-white;
  height: 40px;
  line-height: 40px;
  cursor: pointer;

  &.primary {
    background-color: variables.$color-blue;

    &:hover {
      background-color: variables.$color-primary-hover;
    }

    &:active {
      background: rgba(variables.$color-blue, 0.9);
    }
  }

  &.secondary {
    background-color: variables.$color-border;
    color: variables.$color-light-grey;

    &:hover {
      background-color: variables.$color-hover;
      color: variables.$color-white;
    }

    &:active {
      background: variables.$color-darker-grey;
      color: rgba(variables.$color-white, 0.8);
    }
  }

  &:focus-visible::before {
    content: '';
    position: absolute;
    margin: -8px;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 4px solid rgba(variables.$color-blue, 0.44);
    border-radius: 10px;
  }

  &.disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  &.half {
    width: 48%;
    margin: 0;
    display: inline-block;
  }

  &.small {
    width: auto;
    line-height: 1px;
    padding: 10px;
    font-size: 12px;
  }

  &.third {
    display: inline-block;
    width: 32%;
    margin: 0;
  }

  &.small.third {
    height: 24px;
    font-size: 12px;
  }

  &.confirm,
  &.danger {
    background: variables.$color-blue;
    color: variables.$color-white;
  }

  &.inline {
    display: inline-block;
    padding: 0 20px;
    width: auto;
    margin: 8px 10px;
  }

  &.inactive {
    opacity: 0.4;
  }

  &.hollow {
    background: transparent;
  }

  &.nowrap {
    white-space: nowrap;
  }

  &.backgroundless {
    &.small {
      @extend %face-sans-16-medium;
    }

    &.primary {
      color: variables.$color-blue;
      border: 1px solid variables.$color-blue;

      &:hover {
        background-color: rgba(variables.$color-primary, 0.1);
      }
    }

    &.alternative {
      color: variables.$color-red;
      border: 1px solid variables.$color-red;

      &:hover {
        background-color: rgba(variables.$color-red, 0.1);
      }
    }
  }

  &.has-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 4px;

    .icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      margin: -2px 0;
      color: inherit;
    }
  }

  &.new-ui {
    width: auto;
    border-radius: variables.$border-radius-interactive;
    padding: 10px 20px;
    line-height: 20px;
    flex-grow: 1;
    margin-left: 0;
    margin-right: 0;
    transition: all 100ms;

    &.secondary {
      background-color: variables.$color-medium-grey;

      &:hover {
        background-color: rgba(variables.$color-white, 0.2);
      }
    }

    &.alternative {
      background-color: variables.$color-bg-6;

      &:hover {
        background-color: variables.$color-bg-5-hover;
      }
    }

    &.extend {
      width: 100%;
    }
  }

  &.extend {
    width: 100%;
  }
}
</style>
