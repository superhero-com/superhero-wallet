<template>
  <div class="transaction-tag">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/typography';
@use '../../styles/variables';

.transaction-tag {
  @extend %face-sans-11-medium;

  padding: 1px 5px;
  color: variables.$color-grey-dark;
  border: 1px solid variables.$color-grey-dark;
  border-radius: 4px;
  text-transform: uppercase;
  white-space: nowrap;
  width: min-content;
  user-select: none;
}
</style>
