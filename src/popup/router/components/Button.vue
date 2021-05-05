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
        onboarding,
        third,
        inline,
        inactive,
        bold,
      },
    ]"
    v-on="$listeners"
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
    inline: Boolean,
    inactive: Boolean,
    to: { type: [String, Object], default: null },
    bold: Boolean,
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
  display: block;
  position: relative;
  text-decoration: none;
  width: 280px;
  border-radius: 6px;

  @extend %face-sans-16-bold;

  padding: 0;
  margin: 8px auto;
  color: variables.$color-white;
  height: 40px;
  line-height: 40px;

  &.primary {
    background-color: variables.$color-blue;

    &:hover {
      background-color: variables.$color-blue-hover;
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

  &.extend {
    width: 100%;
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

  &.onboarding {
    width: 100px;
    font-size: 14px;
    height: 34px;
    border-radius: 5px;
    line-height: 34px;
    background: variables.$color-bg-2;
    margin: 0;
    margin-right: 10px;
    font-weight: 500;
    color: variables.$color-white;

    &:last-child {
      margin-right: 0;
    }

    &.skip {
      background: variables.$color-error;
    }

    &.next {
      background: variables.$color-blue;
    }

    &.start {
      margin-left: auto;
      margin-right: 0;
      background: variables.$color-blue;
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
