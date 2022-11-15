<template>
  <div
    class="details-item"
  >
    <div class="label">
      {{ label }}
      <span
        v-if="$slots.label"
        :class="{ indent: label }"
      >
        <slot name="label" />
      </span>
    </div>
    <div
      class="value"
      :class="{ small, highlight }"
    >
      {{ value }}
      <span
        v-if="secondary"
        class="secondary"
      >
        {{ secondary }}
      </span>
      <slot name="value" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'DetailsItem',
  props: {
    label: { type: String, default: '' },
    value: { type: [String, Number, Array], default: '' },
    secondary: { type: String, default: '' },
    small: Boolean,
    highlight: Boolean,
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.details-item {
  margin-block: 4px;

  .label {
    @extend %face-sans-15-medium;

    display: flex;
    align-items: center;
    margin-bottom: 4px;
    line-height: 16px;
    color: rgba(variables.$color-white, 0.5);

    .indent {
      margin-left: 8px;
    }
  }

  .value {
    @extend %face-sans-15-regular;

    letter-spacing: 0.05em;
    color: variables.$color-white;
    margin-bottom: 8px;

    .secondary {
      color: variables.$color-grey-light;
      margin-left: 4px;
    }

    &.small {
      @extend %face-mono-10-medium;
    }

    &.highlight {
      color: variables.$color-danger;
    }
  }
}
</style>
