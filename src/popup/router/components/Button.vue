<template>
  <Component
    :is="component"
    v-bind="{
      ...$attrs,
      ...(component === 'a' ? { href: to, target: '_blank' } : { to }),
    }"
    v-on="$listeners"
    class="button"
    :class="[
      fill,
      {
        disabled,
        extend,
        half,
        small,
        onboarding,
        dark,
        third,
        inline,
        inactive,
        bold,
      },
    ]"
  >
    <slot />
  </Component>
</template>

<script>
export default {
  props: {
    fill: {
      type: String,
      validator: (value) => ['primary', 'secondary'].includes(value),
      default: 'primary',
    },
    disabled: Boolean,
    extend: Boolean,
    half: Boolean,
    small: Boolean,
    third: Boolean,
    onboarding: Boolean,
    dark: Boolean,
    inline: Boolean,
    inactive: Boolean,
    to: [String, Object],
    bold: Boolean,
  },
  computed: {
    isLinkOnSameHost() {
      return (
        typeof this.to === 'object' ||
        new URL(this.to, window.location).host === window.location.host
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
@import '../../../styles/typography';

.button {
  display: block;
  position: relative;
  text-decoration: none;
  width: 280px;
  border-radius: 6px;

  @extend %face-sans-16-bold;

  padding: 0;
  margin: 8px auto;
  color: $button-text-color;
  height: 40px;
  line-height: 40px;

  &.primary {
    background-color: $color-blue;

    &:hover {
      background-color: $color-blue-hover;
    }

    &:active {
      background: rgba(14, 82, 216, 0.9);
    }
  }

  &.secondary {
    background-color: $color-black;

    &:hover {
      background-color: $color-hover;
    }

    &:active {
      background: rgba(25, 25, 25, 0.8);
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
    border: 4px solid rgba(17, 97, 254, 0.44);
    border-radius: 10px;
  }

  &.disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  &.extend {
    width: 100%;
  }

  &.half {
    width: 48%;
    margin: 0;
    display: inline-block;
  }

  &.dark {
    background: $box-button-color;
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
    background: $secondary-color;
    color: $white-color;
  }

  &.onboarding {
    width: 100px;
    font-size: 14px;
    height: 34px;
    border-radius: 5px;
    line-height: 34px;
    background: $box-button-color;
    margin: 0;
    margin-right: 10px;
    font-weight: 500;
    color: #fff;

    &:last-child {
      margin-right: 0;
    }

    &.skip {
      background: #ff5857;
    }

    &.next {
      background: $secondary-color;
    }

    &.start {
      margin-left: auto;
      margin-right: 0;
      background: $secondary-color;
    }
  }

  &.inline {
    display: inline-block;
    padding: 0 20px;
    width: auto;
    margin: 8px 10px;
  }

  &.bold {
    font-weight: 500;
  }

  &.inactive {
    opacity: 0.4;
  }
}
</style>
