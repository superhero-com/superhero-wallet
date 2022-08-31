<template>
  <button
    v-bind="$attrs"
    class="button-icon"
    v-on="$listeners"
  >
    <slot />
  </button>
</template>
<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/mixins';

$size: 32px;

.button-icon {
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

  svg {
    width: 75%;
    height: 75%;
    color: variables.$color-white;
    opacity: 0.7;
    transition: 0.1s;
  }

  &:hover {
    background-color: variables.$color-hover;

    svg {
      opacity: 1;
    }
  }
}
</style>
