<template>
  <BtnPill
    class="btn-filter"
    :class="{ active: isActive }"
  >
    <slot>{{ text }}</slot>
  </BtnPill>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import BtnPill from './BtnPill.vue';

export default defineComponent({
  components: {
    BtnPill,
  },
  props: {
    text: { type: String, default: null },
    isActive: Boolean,
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.btn-filter {
  @extend %face-sans-14-bold;
  line-height: 20px;
  padding: 4px 12px;
  border: 1px solid transparent;

  &.active,
  &.router-link-exact-active {
    border-color: rgba($color-white, 0.15);
    background-color: rgba($color-white, 0.15);
    color: $color-white;
  }
}
</style>
