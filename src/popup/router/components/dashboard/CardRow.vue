<template>
  <div class="card-row">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'CardRow',
};
</script>

<style lang="scss" scoped>
  .card-row {
    display: flex;
    padding: 0 16px;
    gap: 12px;
    margin-bottom: 12px;
    width: 100%;

    &:last-child {
      margin-bottom: 24px;
    }
  }
</style>
