<template>
  <button
    class="button-plain"
    @click.prevent="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<style lang="scss" scoped>
.button-plain {
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  cursor: pointer;
}
</style>
