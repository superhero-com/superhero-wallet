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
@use '@/styles/variables' as *;

.transaction-tag {
  font-weight: 500;
  font-size: 11px;
  line-height: 16px;
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
