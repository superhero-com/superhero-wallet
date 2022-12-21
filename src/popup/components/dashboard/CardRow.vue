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
  gap: var(--gap);
  margin-bottom: var(--gap);
  width: 100%;

  &:last-of-type {
    margin-bottom: 0;
  }
}
</style>
