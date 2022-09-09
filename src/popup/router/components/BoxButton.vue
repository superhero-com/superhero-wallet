<template>
  <Component
    :is="component"
    class="box-button"
    :class="[
      fill,
      {
        'new-ui': newUi,
        disabled,
      },
    ]"
    :to="to"
    :href="href"
    :target="(href) ? '_blank' : null"
    v-on="$listeners"
  >
    <slot />
  </Component>
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
    newUi: Boolean,
    disabled: Boolean,
  },
  computed: {
    component() {
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
  @extend %face-sans-15-medium;

  width: 88px;
  height: 64px;
  background-color: rgba(variables.$color-white, 0.08);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: variables.$color-dark-grey;
  cursor: pointer;
  user-select: none;

  ::v-deep svg {
    width: 24px;
    height: 24px;
    color: variables.$color-light-grey;
  }

  &.primary {
    &:hover {
      background-color: rgba(variables.$color-blue, 0.15);

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
    background-color: rgba(variables.$color-red, 0.1);

    &,
    ::v-deep svg {
      color: variables.$color-red;
    }
  }

  &.new-ui {
    @extend %face-sans-14-regular;

    height: auto;
    min-height: 58px;
    border-radius: 10px;
    color: variables.$color-white;
    transition: all 100ms;

    &:hover {
      background-color: rgba(variables.$color-white, 0.1);
      color: variables.$color-white;

      .icon {
        opacity: 0.85;
      }
    }

    &:active {
      background-color: rgba(variables.$color-white, 0.15);

      .icon {
        opacity: 1;
      }
    }

    &,
    &:hover,
    &:active {
      .icon {
        color: inherit;
        opacity: 0.75;
      }
    }
  }

  &.disabled {
    pointer-events: none;
    opacity: 0.4;
  }
}
</style>
