<template>
  <div class="plate">
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../../../styles/variables';

.plate {
  width: $container-width;
  overflow-x: hidden;
  position: fixed;
  z-index: 1;

  .content {
    width: #{2px + $container-width};
    margin: -1px 0 0 -1px;
    border: 1px solid rgba($color-border, 0.5);
    border-radius: 0 0 10px 10px;
    background: linear-gradient(180deg, $color-bg-3 0%, $color-black 100%);
  }
}
</style>
