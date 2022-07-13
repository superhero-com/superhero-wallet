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
@use '../../../styles/typography';
@use '../../../styles/variables';

.transaction-tag {
  @extend %face-sans-11-medium;

  padding: 1px 5px;
  color: variables.$color-dark-grey;
  border: 1px solid variables.$color-dark-grey;
  border-radius: 4px;
  text-transform: uppercase;
  white-space: nowrap;
  width: min-content;
  user-select: none;
}
</style>
