<template>
  <div class="icon-boxed">
    <slot>
      <Component
        :is="icon"
        class="icon"
      />
    </slot>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    icon: { type: Object, default: null },
  },
});
</script>

<style lang="scss">
@use '../../styles/variables' as *;

.icon-boxed {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border: 4px solid rgba($color-white, 0.05);
  border-radius: 50%;
  background-color: $color-bg-1;

  .icon {
    width: 48px;
    height: 48px;
  }
}
</style>
