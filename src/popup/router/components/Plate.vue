<template>
  <div
    class="plate"
    :class="{ 'only-top': !$slots.bottom }"
  >
    <template v-if="$slots.bottom">
      <div class="top">
        <slot />
      </div>
      <div class="bottom">
        <slot name="bottom" />
      </div>
    </template>
    <slot v-else />
  </div>
</template>

<style lang="scss" scoped>
@use '../../../styles/variables';

.plate {
  position: sticky;
  top: 48px;
  top: calc(48px + env(safe-area-inset-top));
  z-index: 1;

  &.only-top,
  .top {
    background-color: variables.$color-bg-3-new;
    box-shadow: variables.$color-border 0 1px;
    border-radius: 0 0 10px 10px;
  }

  .top {
    position: relative;
  }

  .bottom {
    margin-top: -9px;
    padding-top: 10px;
    background-color: variables.$color-bg-3;
  }
}
</style>
