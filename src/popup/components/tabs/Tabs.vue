<template>
  <div class="tabs">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.tabs {
  @include mixins.flex(flex-start, center, row);

  padding: 4px;
  border-radius: $border-radius-interactive;
  background-color: $color-black;
}
</style>
