<template>
  <div class="plate">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
@import '../../../styles/variables';

.plate {
  position: sticky;
  top: 48px;
  top: calc(48px + env(safe-area-inset-top));
  z-index: 1;
  margin-left: -1px;
  border: 1px solid rgba($color-border, 0.5);
  border-radius: 0 0 10px 10px;
  background: linear-gradient(180deg, $color-bg-3 0%, $color-black 100%);
}
</style>
