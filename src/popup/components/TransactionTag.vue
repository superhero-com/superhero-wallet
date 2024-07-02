<template>
  <div class="transaction-tag">
    {{ txType }}
  </div>
</template>

<script>
export default {
  props: {
    txType: {
      type: String,
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/typography';
@use '@/styles/variables' as *;

.transaction-tag {
  @extend %face-sans-11-medium;

  padding: 2px 5px;
  color: $color-grey-dark;
  border: 1px solid $color-grey-dark;
  border-radius: 4px;
  text-transform: uppercase;
  white-space: nowrap;
  width: min-content;
  user-select: none;
}
</style>
