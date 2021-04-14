<template>
  <div class="plate">
    <div class="fixed">
      <slot />
    </div>
    <div class="hidden">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/mixins';

@mixin plate {
  top: 48px;
  top: calc(48px + env(safe-area-inset-top));
  z-index: 1;
  box-shadow: rgba(variables.$color-border, 0.5) 0 1px;
  border-radius: 0 0 10px 10px;
  background: linear-gradient(180deg, variables.$color-bg-3 0%, variables.$color-black 100%);
}

.plate {
  @include mixins.desktop {
    @include plate;

    position: sticky;
  }

  .fixed {
    @include mixins.below-desktop {
      @include plate;

      position: fixed;
      left: 0;
      right: 0;
    }
  }

  .hidden {
    visibility: hidden;

    @include mixins.desktop {
      display: none;
    }
  }
}
</style>
