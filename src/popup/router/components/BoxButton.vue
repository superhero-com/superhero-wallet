<template>
  <component
    :is="componentType"
    class="box-button"
    :class="[ fill, (disabled) && 'disabled' ]"
    :to="to"
    :href="href"
    :target="(href) && '_blank'"
    @click.prevent="!disabled && $emit('click', $event)"
  >
    <slot />
  </component>
</template>

<script>
export default {
  props: {
    to: { type: [String, Object], default: null },
    href: { type: String, default: null },
    fill: {
      type: String,
      validator: (value) => ['primary', 'alternative'].includes(value),
      default: 'primary',
    },
    disabled: Boolean,
  },
  computed: {
    componentType() {
      if (this.to) {
        return 'RouterLink';
      }
      if (this.href) {
        return 'a';
      }
      return 'button';
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.box-button {
  width: 88px;
  height: 64px;
  background: variables.$color-bg-2;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: variables.$color-dark-grey;
  cursor: pointer;

  @extend %face-sans-15-medium;

  ::v-deep svg {
    width: 24px;
    height: 24px;
    color: variables.$color-light-grey;
  }

  &.primary {
    &:hover {
      background: rgba(variables.$color-blue, 0.15);

      &,
      ::v-deep svg {
        color: variables.$color-blue;
      }
    }

    &:active {
      background-color: rgba(variables.$color-primary, 0.1);
    }
  }

  &.alternative:hover {
    background: variables.$color-red-alpha-10;

    &,
    ::v-deep svg {
      color: variables.$color-red;
    }
  }

  &.disabled {
    background-color: variables.$color-disabled;
    color: variables.$color-light-grey;
    opacity: 0.44;

    &:hover {
      &,
      ::v-deep svg {
        color: variables.$color-light-grey;
        cursor: not-allowed;
      }
    }
  }
}
</style>
