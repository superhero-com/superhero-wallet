<template>
  <div class="plate">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
@use '../../../styles/variables';

.plate {
  position: sticky;
  top: 48px;
  top: calc(48px + env(safe-area-inset-top));
  z-index: 1;
  border-radius: 0 0 10px 10px;
  background: variables.$color-white;
  box-shadow: 0px 8px 32px rgb(0 0 0 / 10%);
}
</style>
