<template>
  <div class="plate">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
@import '../../../styles/variables';

.plate {
  width: $container-width;
  box-shadow: rgba($color-border, 0.5) 0 1px;
  border-radius: 0 0 10px 10px;
  background: linear-gradient(180deg, $color-bg-3 0%, $color-black 100%);
}
</style>
