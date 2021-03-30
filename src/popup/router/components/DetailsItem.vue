<template>
  <div class="details-item">
    <div class="label">
      {{ label }}
      <span v-if="$slots.label" :class="{ indent: label }">
        <slot name="label" />
      </span>
    </div>
    <div class="value" :class="{ small, highlight }">
      {{ value }}
      <span class="secondary" v-if="secondary">
        {{ secondary }}
      </span>
      <slot v-if="$slots.value" name="value" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'DetailsItem',
  props: {
    label: { type: String, default: '' },
    value: { type: [String, Number], default: '' },
    secondary: { type: String },
    small: { type: Boolean },
    highlight: { type: Boolean },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';
@import '../../../styles/typography';

.details-item {
  .label {
    margin-bottom: 8px;
    display: flex;
    align-items: center;

    @extend %face-sans-15-medium;

    line-height: 16px;
    color: $color-dark-grey;

    .indent {
      margin-left: 8px;
    }
  }

  .value {
    @extend %face-sans-14-regular;

    color: $color-white;
    margin-bottom: 8px;

    .secondary {
      color: $color-light-grey;
      margin-left: 4px;
    }

    &.small {
      @extend %face-sans-11-regular;
    }

    &.highlight {
      color: $color-error;
    }
  }
}
</style>
