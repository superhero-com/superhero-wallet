<template>
  <div class="details-row">
    <div class="title">
      {{ label }}
    </div>
    <div class="text">
      {{ text }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    label: { type: String, required: true },
    text: { type: [String, Number], default: 'N/A' },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';

.details-row {
  font-size: 15px;
  padding: 9px 15px;
  background-color: variables.$color-bg-3;
  display: flex;

  .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: variables.$color-dark-grey;
    font-weight: 500;
    width: 100%;
  }

  .text {
    color: variables.$color-white;

    .primary {
      color: variables.$color-green;
    }
  }
}
</style>
