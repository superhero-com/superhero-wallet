<template>
  <ul class="panel-list">
    <slot />
  </ul>
</template>

<style lang="scss" scoped>
@use "../../../styles/variables";

.panel-list {
  padding: 0;
  background: variables.$color-bg-1;
  box-shadow: 0 0 8px rgba(variables.$color-blue, 0.15);
  border-radius: 4px;
  margin-top: 30px;
}
</style>
