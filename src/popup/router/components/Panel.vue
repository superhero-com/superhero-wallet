<template>
  <ul class="panel-list">
    <slot />
  </ul>
</template>

<style lang="scss">
.panel-list {
  padding: 0 !important;
  background: #21222a !important;
  box-shadow: 0 0 8px rgba(0, 33, 87, 0.15);
  border-radius: 4px;
  margin-top: 30px;
}
</style>