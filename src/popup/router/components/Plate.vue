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
  box-shadow: rgba(variables.$color-border, 0.5) 0 1px;
  border-radius: 0 0 10px 10px;
  background: linear-gradient(180deg, variables.$color-bg-3 0%, variables.$color-black 100%);
}
</style>
