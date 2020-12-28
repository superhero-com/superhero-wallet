<template>
  <Component
    :is="to ? 'RouterLink' : 'button'"
    :to="to"
    class="primary-button"
    @click="$emit('click')"
    :class="{
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
    }"
  >
    <slot />
  </Component>
</template>

<script>
export default {
  props: {
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
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.primary-button {
  display: block;
  text-decoration: none;
  background-color: $button-color;
  width: 270px;
  border-radius: 5px;
  font-family: 'Roboto', sans-serif;
  font-size: 15px;
  padding: 0;
  margin: 8px auto;
  color: $button-text-color;
  font-weight: normal;
  line-height: 40px;
  max-height: 40px;

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
    width: 32%;
    margin: 0;
    max-height: 100px;
    line-height: normal;
    padding: 5px;
    word-break: break-word;
    display: inline-block;
  }

  &.small.third {
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
