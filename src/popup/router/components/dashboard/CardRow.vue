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
    padding: 0 var(--screen-padding-x);
    gap: var(--gap);
    margin-bottom: var(--gap);
    width: 100%;

    &:last-child {
      margin-bottom: 24px;
    }
  }
</style>
