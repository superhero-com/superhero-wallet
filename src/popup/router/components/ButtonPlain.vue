<template>
  <button
    class="button-plain"
    :class="{ extend }"
    @click.prevent="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script>
export default {
  props: {
    extend: Boolean,
  },
};
</script>

<style lang="scss" scoped>
.button-plain {
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  cursor: pointer;

  &.extend {
    width: 100%;
  }
}
</style>
