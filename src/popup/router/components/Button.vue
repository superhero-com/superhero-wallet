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

<style lang="scss">
@import '../../../common/variables';

.primary-button {
  display: block;
  text-decoration: none;
  background: $button-color !important;
  width: 270px;
  border-radius: 5px;
  font-family: 'Roboto', sans-serif;
  font-size: 15px;
  padding: 0;
  margin: 8px auto;
  color: $button-text-color !important;
  font-weight: normal;
  line-height: 40px;
  max-height: 40px;

  span {
    color: $button-text-color !important;
  }

  &.disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  &.extend {
    width: 100% !important;
  }

  &.half {
    width: 48% !important;
    margin: 0 !important;
    display: inline-block;
  }

  &.dark {
    background: $box-button-color !important;
  }

  &.small {
    width: auto !important;
    line-height: 1px;
    padding: 10px;
    font-size: 12px;
  }

  &.third {
    width: 32% !important;
    margin: 0 !important;
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
    background: $secondary-color !important;
    color: $white-color !important;
  }

  &.onboarding {
    width: 100px !important;
    font-size: 14px;
    height: 34px;
    border-radius: 5px;
    line-height: 34px !important;
    background: $box-button-color !important;
    margin: 0 !important;
    margin-right: 10px !important;
    font-weight: 500 !important;
    color: #fff !important;

    &:last-child {
      margin-right: 0 !important;
    }

    &.skip {
      background: #ff5857 !important;
    }

    &.next {
      background: $secondary-color !important;
    }

    &.start {
      margin-left: auto !important;
      margin-right: 0 !important;
      background: $secondary-color !important;
    }
  }

  &.inline {
    display: inline-block;
    padding: 0 20px;
    width: auto !important;
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
