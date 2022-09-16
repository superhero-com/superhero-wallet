<template>
  <div class="details-row">
    <div class="title">
      <slot name="label">
        {{ label }}
      </slot>
    </div>
    <span class="text">
      <slot name="text">
        {{ text }}
      </slot>
    </span>
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
  padding: 8px 16px;
  background-color: var(--screen-bg-color);
  display: flex;
  justify-content: space-between;

  @extend %face-sans-15-medium;

  .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: variables.$color-dark-grey;
  }

  .text {
    color: variables.$color-light-grey;

    .primary {
      color: variables.$color-green;
    }

    &.primary {
      color: variables.$color-blue;
    }
  }

  .white {
    color: variables.$color-white;
  }
}
</style>
