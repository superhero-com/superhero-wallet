<template>
  <Component
    :is="component"
    v-bind="$attrs"
    class="button-icon"
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
    to: { type: Object, default: null },
    href: { type: String, default: null },
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

.button-icon {
  $size: 32px;

  @include mixins.flex(center, center);

  width: $size;
  height: $size;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 50%;
  outline: none;
  transition: 0.1s;
  cursor: pointer;

  > .icon {
    width: 75%;
    height: 75%;
    color: variables.$color-white;
    opacity: 0.7;
    transition: 0.1s;
  }

  &:hover {
    background-color: variables.$color-hover;

    > .icon {
      opacity: 1;
    }
  }
}
</style>
