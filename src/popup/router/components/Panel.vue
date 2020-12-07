<template>
  <ul class="panel-list">
    <slot />
  </ul>
</template>

<style lang="scss" scoped>
.panel-list {
  padding: 0;
  background: #21222a;
  box-shadow: 0 0 8px rgba(0, 33, 87, 0.15);
  border-radius: 4px;
  margin-top: 30px;
}
</style>
