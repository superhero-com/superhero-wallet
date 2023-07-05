<template>
  <BtnPlain
    v-bind="$attrs"
    class="list-item-wrapper"
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
@use '../../styles/variables' as *;
@use '../../styles/mixins';

.list-item-wrapper {
  display: block;
  padding: 10px 12px;
  color: unset;
  text-decoration: unset;
  text-align: left;
  inline-size: -webkit-fill-available; // Fix max width for <button>
  transition: background-color 0.12s ease-in-out;

  &:hover {
    background-color: rgba($color-bg-4-hover, 0.5);

    @include mixins.mobile {
      background-color: transparent;
    }
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
