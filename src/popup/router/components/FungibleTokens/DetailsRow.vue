<template>
  <div class="details-row">
    <div class="title text-ellipsis">
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
@import '../../../../styles/variables';

.details-row {
  font-size: 15px;
  padding: 9px 15px;
  background-color: $color-bg-3;
  display: flex;

  .title {
    color: $color-dark-grey;
    font-weight: 500;
    width: 100%;
  }

  .text {
    color: $color-white;

    .primary {
      color: $color-green;
    }
  }
}
</style>
