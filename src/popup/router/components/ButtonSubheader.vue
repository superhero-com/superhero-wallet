<template>
  <Button
    class="button-subheader"
    :class="fill"
    :to="to"
    @click="$emit('click')"
  >
    <div class="box">
      <span class="icon">
        <slot />
      </span>

      <div class="message">
        <span class="heading">{{ header }}</span>
        <span class="description">{{ subheader }}</span>
      </div>
    </div>
  </Button>
</template>

<script>
export default {
  props: {
    to: { type: [String, Object], default: '' },
    header: { type: String, default: '' },
    subheader: { type: String, default: '' },
    fill: {
      type: String,
      validator: (value) => ['primary', 'alternative'].includes(value),
      default: 'primary',
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.button-subheader {
  background: variables.$color-bg-6;
  border-radius: 10px;
  margin: 16px;
  height: 80px;
  width: 328px;
  align-self: flex-start;
  cursor: pointer;

  &.primary {
    &:hover {
      background: variables.$color-bg-5-hover;
    }
  }

  .box {
    @include mixins.flex(flex-start, center);

    text-decoration: none;
    color: variables.$color-dark-grey;
    gap: 24px;
    margin-left: 16px;

    .icon {
      @include mixins.flex(center, center);

      width: 36px;
      height: 36px;
      border-radius: 14px;
      background-color: rgba(variables.$color-white, 0.15);
      opacity: 0.8;

      ::v-deep svg {
        width: 20px;
        height: 20px;
        color: variables.$color-white;
      }
    }
  }

  .message {
    @include mixins.flex(flex-start, flex-start, column);

    .heading {
      @extend %face-sans-16-bold;

      color: variables.$color-white;
    }

    .description {
      @extend %face-sans-13-medium ;

      color: rgba(variables.$color-white, 0.7);
    }
  }
}
</style>
