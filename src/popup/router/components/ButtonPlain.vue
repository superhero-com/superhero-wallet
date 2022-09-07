<template>
  <Component
    :is="(to) ? 'RouterLink' : 'button'"
    class="button-plain"
    :class="{ extend }"
    :to="to"
    @click.prevent="$emit('click', $event)"
  >
    <slot>{{ text }}</slot>
  </Component>
</template>

<script>
export default {
  props: {
    extend: Boolean,
    text: { type: String, default: null },
    to: { type: Object, default: null },
  },
};
</script>

<style lang="scss" scoped>
.button-plain {
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  text-decoration: none;
  color: inherit;
  cursor: pointer;

  &.extend {
    width: 100%;
  }
}
</style>
