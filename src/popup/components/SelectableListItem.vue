<template>
  <BtnPlain
    v-bind="$attrs"
    class="selectable-list-item"
    :class="{ selected }"
  >
    <slot />
  </BtnPlain>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import BtnPlain from './buttons/BtnPlain.vue';

export default defineComponent({
  components: {
    BtnPlain,
  },
  props: {
    selected: Boolean,
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.selectable-list-item {
  display: block;
  padding: 8px var(--screen-padding-x);
  margin-left: calc(-1 * var(--screen-padding-x));
  margin-right: calc(-1 * var(--screen-padding-x));
  color: unset;
  text-decoration: unset;
  text-align: left;
  inline-size: -webkit-fill-available; // Fix max width for <button>
  transition: background-color 0.12s ease-in-out;

  &:hover {
    background-color: $color-bg-4-hover;
  }

  &:active {
    opacity: 0.5;
  }

  &.selected {
    color: $color-white;
    background-color: rgba($color-primary, 0.2);
  }
}
</style>
