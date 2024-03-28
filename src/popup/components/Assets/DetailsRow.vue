<template>
  <div class="details-row">
    <div class="title">
      <slot name="label">
        {{ label }}
      </slot>
    </div>

    <div class="text">
      <slot name="text">
        {{ text }}
      </slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    label: { type: String, default: null },
    text: { type: [String, Number], default: 'N/A' },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.details-row {
  @extend %face-sans-15-medium;

  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px var(--screen-padding-x);

  .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: rgba(variables.$color-white, 0.5);
  }

  .text {
    color: rgba(variables.$color-white, 0.75);
  }
}
</style>
