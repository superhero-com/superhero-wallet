<template>
  <div class="card-mnemonic">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CardMnemonic',
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.card-mnemonic {
  background: rgba($color-white, 0.15);
  border: 2px solid rgba($color-white, 0.1);
  border-radius: $border-radius-modal;
  padding: 12px;
}
</style>
