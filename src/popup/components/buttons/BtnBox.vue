<template>
  <Component
    :is="component"
    class="btn-box"
    :class="[
      variant,
      {
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
const VARIANTS = ['primary'];

export default {
  props: {
    to: { type: [Object, String], default: null },
    href: { type: String, default: null },
    variant: {
      type: String,
      validator: (value) => VARIANTS.includes(value),
      default: 'primary',
    },
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

.btn-box {
  @extend %face-sans-14-regular;

  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  height: auto;
  min-height: 58px;
  border-radius: variables.$border-radius-interactive;
  background-color: rgba(variables.$color-white, 0.08);
  text-decoration: none;
  color: variables.$color-white;
  cursor: pointer;
  user-select: none;
  transition: all 100ms;

  &:active {
    .icon {
      opacity: 1;
    }
  }

  .icon {
    width: 24px;
    height: 24px;
    color: inherit;
    opacity: 0.75;
  }

  &.primary {
    &:hover {
      background-color: rgba(variables.$color-white, 0.1);
    }

    &:active {
      background-color: rgba(variables.$color-white, 0.15);
    }
  }

  &.disabled {
    pointer-events: none;
    opacity: 0.4;
  }
}
</style>
