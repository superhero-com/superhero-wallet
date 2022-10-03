<template>
  <Component
    :is="component"
    v-bind="$attrs"
    class="btn-icon"
    :class="[size, variant]"
    :to="to"
    :href="href"
    :target="(href) ? '_blank' : null"
    v-on="$listeners"
  >
    <slot />
  </Component>
</template>

<script>
const SIZES = ['rg', 'md'];

export default {
  props: {
    to: { type: Object, default: null },
    href: { type: String, default: null },
    variant: { type: String, default: null },
    size: {
      type: String,
      default: 'md',
      validator: (val) => SIZES.includes(val),
    },
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

<style lang="scss">
@use '../../../styles/variables';
@use '../../../styles/mixins';

.btn-icon {
  --size: 20px;

  @include mixins.flex(center, center);

  padding: 4px;
  background: transparent;
  border: none;
  border-radius: 50%;
  outline: none;
  transition: 0.2s;
  cursor: pointer;

  > .icon {
    color: variables.$color-white;
    width: var(--size);
    height: var(--size);
    opacity: 0.7;
    transition: 0.1s;
  }

  &.rg {
    --size: 20px;
  }

  &.md {
    --size: 24px;
  }

  &:hover {
    background-color: variables.$color-grey-dark-hover;

    > .icon {
      opacity: 1;
    }
  }

  &:active {
    background-color: variables.$color-grey-medium;
  }

  &.pink {
    &:hover {
      > .icon {
        color: variables.$color-pink;
      }
    }
  }

  &.dimmed {
    &:hover {
      > .icon {
        opacity: 0.75;
      }
    }
  }
}
</style>
