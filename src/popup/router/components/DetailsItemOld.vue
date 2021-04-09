<template>
  <div class="details-item" :class="direction">
    <label v-if="label">{{ label }}</label>
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    label: { type: String, required: false },
    direction: { type: String, required: false },
  },
};
</script>

<style lang="scss" scoped>
.details-item {
  word-break: break-all;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 0;
  border-bottom: 1px solid #12121b;
  padding: 10px;
  font-size: 14px;

  &.column {
    flex-direction: column;
    align-items: start;
    text-align: left;
  }

  label {
    font-weight: bold;
    font-size: 16px;
  }
}
</style>
