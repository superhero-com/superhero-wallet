<template>
  <div class="badge">
    <slot />
  </div>
</template>

<style land="scss" scoped>
.badge {
  font-size: 12px;
  font-weight: bold;
  border-radius: 3px;
  padding: 0 5px;
  display: inline-block;
  line-height: 16px;
  cursor: pointer;
}
</style>
