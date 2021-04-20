<template>
  <ul class="panel-list">
    <slot />
  </ul>
</template>

<style lang="scss" scoped>
@import "../../../styles/variables";

.panel-list {
  padding: 0;
  background: $color-bg-1;
  box-shadow: 0 0 8px rgba($color-blue, 0.15);
  border-radius: 4px;
  margin-top: 30px;
}
</style>
